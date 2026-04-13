"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type VoiceStatus = "idle" | "listening" | "processing" | "thinking" | "speaking";

export interface HistoryItem {
  id: string;
  query: string;
  written: string;
}

interface VoiceCtx {
  isListening: boolean;
  voiceStatus: VoiceStatus;
  transcript: string;
  lastCommand: string | null;
  aiResponse: string | null;
  lastQuery: string | null;
  isThinking: boolean;
  history: HistoryItem[];
  clearHistory: () => void;
  clearResponse: () => void;
  toggleListening: () => void;
  startListening: () => void;
  stopListening: () => void;
  showInput: boolean;
  setShowInput: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const VoiceContext = createContext<VoiceCtx | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be inside VoiceProvider");
  return ctx;
}

const NAV_COMMANDS = [
  { pattern: /\b(go home|open home|home|dashboard)\b/i,              path: "/",          label: "→ Home" },
  { pattern: /\b(go back|back|previous page|return)\b/i,             path: "BACK",       label: "← Go Back" },
  { pattern: /\b(history|past sessions|conversations)\b/i,           path: "/history",   label: "→ History" },
  { pattern: /\b(knowledge|knowledge base|documents)\b/i,            path: "/knowledge", label: "→ Knowledge Base" },
  { pattern: /\b(notebook|notes|note)\b/i,                           path: "/notebook",  label: "→ Notebooks" },
  { pattern: /\b(question generator|questions|generate questions)\b/i,path: "/question",  label: "→ Question Generator" },
  { pattern: /\b(smart solver|solver|solve|math)\b/i,                path: "/solver",    label: "→ Smart Solver" },
  { pattern: /\b(guided learning|learning|guide|learn)\b/i,          path: "/guide",     label: "→ Guided Learning" },
  { pattern: /\b(idea gen|ideagen|ideas|brainstorm)\b/i,             path: "/ideagen",   label: "→ IdeaGen" },
  { pattern: /\b(deep research|research)\b/i,                        path: "/research",  label: "→ Deep Research" },
  { pattern: /\b(co.?writer|writing|co write)\b/i,                   path: "/co_writer", label: "→ Co-Writer" },
  { pattern: /\b(settings|preferences)\b/i,                          path: "/settings",  label: "→ Settings" },
];

const UI_COMMANDS = [
  { pattern: /\b(type|keyboard|show keyboard|text input)\b/i, action: "KEYBOARD" },
  { pattern: /\b(open menu|menu|navigation|sidebar)\b/i,      action: "MENU" },
  { pattern: /\b(close|dismiss|clear|hide)\b/i,               action: "CLEAR" },
];

export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [isListening,  setIsListening]  = useState(false);
  const [voiceStatus,  setVoiceStatus]  = useState<VoiceStatus>("idle");
  const [transcript,   setTranscript]   = useState("");
  const [lastCommand,  setLastCommand]  = useState<string | null>(null);
  const [aiResponse,   setAiResponse]   = useState<string | null>(null);
  const [lastQuery,    setLastQuery]    = useState<string | null>(null);
  const [isThinking,   setIsThinking]   = useState(false);
  const [showInput,    setShowInput]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [history,      setHistory]      = useState<HistoryItem[]>([]);

  // WebRTC refs
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const dcRef     = useRef<RTCDataChannel | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Prevents the auto-reconnect from firing after an intentional stop
  const manualStop = useRef(false);

  // Pending conversation accumulation
  const pendingQueryRef    = useRef<string>("");
  const pendingResponseRef = useRef<{ id: string; text: string } | null>(null);

  // Stable refs so event handler closure never goes stale
  const routerRef         = useRef(router);
  const setShowInputRef   = useRef(setShowInput);
  const setSidebarRef     = useRef(setSidebarOpen);
  const clearResponseRef  = useRef<() => void>(() => {});
  useEffect(() => { routerRef.current = router; }, [router]);

  const clearResponse = useCallback(() => {
    setAiResponse(null);
    setLastQuery(null);
    setIsThinking(false);
  }, []);
  useEffect(() => { clearResponseRef.current = clearResponse; }, [clearResponse]);

  const clearHistory = useCallback(() => setHistory([]), []);

  // ── Realtime API event handler ───────────────────────────────────────────
  const handleServerEvent = useCallback((event: any) => {
    switch (event.type) {

      // User voice detected
      case "input_audio_buffer.speech_started":
        setIsListening(true);
        setVoiceStatus("listening");
        setTranscript("");
        break;

      // User stopped speaking — AI is processing
      case "input_audio_buffer.speech_stopped":
        setIsListening(false);
        setVoiceStatus("thinking");
        setIsThinking(true);
        break;

      // Final user transcript
      case "conversation.item.input_audio_transcription.completed": {
        const userText = event.transcript?.trim();
        if (!userText) break;

        setTranscript(userText);
        pendingQueryRef.current = userText;
        setLastQuery(userText);

        // UI commands
        for (const cmd of UI_COMMANDS) {
          if (cmd.pattern.test(userText)) {
            if (cmd.action === "KEYBOARD") setShowInputRef.current(true);
            else if (cmd.action === "MENU")  setSidebarRef.current(true);
            else if (cmd.action === "CLEAR") clearResponseRef.current();
            setLastCommand(cmd.action === "KEYBOARD" ? "Show keyboard" : cmd.action === "MENU" ? "Open menu" : "Cleared");
            setTimeout(() => setLastCommand(null), 2000);
            return;
          }
        }

        // Nav commands — cancel AI reply and navigate
        for (const cmd of NAV_COMMANDS) {
          if (cmd.pattern.test(userText)) {
            setLastCommand(cmd.label);
            setVoiceStatus("processing");
            setSidebarRef.current(false);
            try { dcRef.current?.send(JSON.stringify({ type: "response.cancel" })); } catch {}
            setTimeout(() => {
              if (cmd.path === "BACK") routerRef.current.back();
              else routerRef.current.push(cmd.path);
              setTimeout(() => setLastCommand(null), 2000);
            }, 350);
            return;
          }
        }
        break;
      }

      // AI audio starts — it's speaking
      case "response.audio.started":
        setIsThinking(false);
        setVoiceStatus("speaking");
        break;

      // Accumulate AI transcript
      case "response.audio_transcript.delta":
        if (event.delta) {
          if (!pendingResponseRef.current || pendingResponseRef.current.id !== event.item_id) {
            pendingResponseRef.current = { id: event.item_id ?? Date.now().toString(), text: event.delta };
          } else {
            pendingResponseRef.current.text += event.delta;
          }
        }
        break;

      // AI transcript fully done — commit ONE entry to history here only
      case "response.audio_transcript.done": {
        const text = pendingResponseRef.current?.text;
        if (text) {
          const query = pendingQueryRef.current || "…";
          setHistory((prev) => [...prev, { id: Date.now().toString(), query, written: text }]);
          setAiResponse(text);
          pendingQueryRef.current = "";
          pendingResponseRef.current = null;
        }
        break;
      }

      // AI audio fully done — back to listening
      case "response.audio.done":
        setVoiceStatus("listening");
        setIsListening(true);
        setIsThinking(false);
        break;

      // response.done: intentionally NOT adding to history here (would be a duplicate)
      case "response.done":
        break;
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    manualStop.current = true;
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioRef.current) { audioRef.current.srcObject = null; }
    pcRef.current     = null;
    dcRef.current     = null;
    streamRef.current = null;
    setVoiceStatus("idle");
    setIsListening(false);
    setIsThinking(false);
    setTranscript("");
  }, []);

  // ── Connect via WebRTC ────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (pcRef.current) return; // already connected
    manualStop.current = false;

    try {
      const tokenRes = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: "alloy" }),
      });
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) return;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // AI audio output
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };

      // Mic input — echo cancellation prevents AI from hearing itself
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });
      streamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Events data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try { handleServerEvent(JSON.parse(e.data)); } catch {}
      };
      dc.onopen = () => {
        setVoiceStatus("listening");
        setIsListening(true);
      };

      // Only auto-reconnect if disconnect was NOT intentional
      pc.onconnectionstatechange = () => {
        if (
          !manualStop.current &&
          (pc.connectionState === "disconnected" || pc.connectionState === "failed")
        ) {
          pcRef.current = null;
          setTimeout(() => connect(), 2000);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        pcRef.current = null;
        return;
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (err) {
      console.error("Realtime connect error:", err);
      pcRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleServerEvent]);

  // Auto-connect on mount; fully disconnect on unmount
  useEffect(() => {
    const timer = setTimeout(() => connect(), 800);
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public controls ───────────────────────────────────────────────────────
  const startListening = useCallback(() => connect(), [connect]);
  const stopListening  = useCallback(() => disconnect(), [disconnect]);

  const toggleListening = useCallback(() => {
    if (isListening || voiceStatus === "thinking" || voiceStatus === "speaking") {
      disconnect();
    } else {
      connect();
    }
  }, [isListening, voiceStatus, connect, disconnect]);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        voiceStatus,
        transcript,
        lastCommand,
        aiResponse,
        lastQuery,
        isThinking,
        history,
        clearHistory,
        clearResponse,
        toggleListening,
        startListening,
        stopListening,
        showInput,
        setShowInput,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}
