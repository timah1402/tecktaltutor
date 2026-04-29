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
import { useNavigation } from "./NavigationProvider";
import type { PageActionEvent } from "./NavigationProvider";

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
  activeTool: string | null;
  wsConnected: boolean;
  history: HistoryItem[];
  clearHistory: () => void;
  clearResponse: () => void;
  cancelRequest: () => void;          // abort current agent query immediately
  toggleListening: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendTextMessage: (text: string) => void;
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

// Pure navigation intent patterns — require an explicit nav verb so that
// "solve X in the solver" or "create a notebook" fall through to the agent.
const NAV_COMMANDS = [
  { pattern: /\b(go home|open home|take me home|back to home|home screen)\b/i, path: "/" },
  { pattern: /\b(go back|back to home)\b/i,                                    path: "BACK" },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(history|past sessions)\b/i,           path: "/history"  },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(knowledge base)\b/i,                  path: "/knowledge" },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(notebook[s]? page|the notebook)\b/i,  path: "/notebook" },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(question[s]? (page|generator))\b/i,   path: "/question" },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(solver|smart solver)\b/i,             path: "/solver"   },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(guided learning|the guide)\b/i,       path: "/guide"    },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(idea ?gen)\b/i,                       path: "/ideagen"  },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(research( page| lab)?|deep research)\b/i, path: "/research" },
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(co.?writer)\b/i,                     path: "/co_writer"},
  { pattern: /\b(open|go to|take me to|navigate to|show me|switch to)\b.{0,30}\b(voice( page)?)\b/i,                  path: "/voice"    },
];

// Natural, contextual reply per destination
const NAV_REPLIES: Record<string, string[]> = {
  "/":          ["Back to home!"],
  "BACK":       ["Back to home!"],
  "/history":   ["Opening your session history!"],
  "/knowledge": ["Opening the Knowledge Base for you!"],
  "/notebook":  ["Opening your Notebooks!"],
  "/question":  ["Opening the Question Generator! What topic should I generate questions on?"],
  "/solver":    ["Opening the Smart Solver! What problem would you like to solve?", "Taking you to the Solver — drop your equation in and I'll work through it!"],
  "/guide":     ["Opening Guided Learning! What topic would you like to study?"],
  "/ideagen":   ["Opening IdeaGen! What subject should we brainstorm ideas for?"],
  "/research":  ["Opening the Research Lab! What topic would you like to explore?", "Let's dive into some deep research — what's the subject?"],
  "/co_writer": ["Opening Co-Writer! What would you like to write today?"],
  "/voice":     ["Opening the Voice page!"],
};

const UI_COMMANDS = [
  { pattern: /\b(type|keyboard|show keyboard|text input)\b/i, action: "KEYBOARD" },
  { pattern: /\b(open menu|menu|navigation|sidebar)\b/i,      action: "MENU" },
  { pattern: /\b(clear (the )?(chat|history|conversation)|new chat|start over)\b/i, action: "CLEAR_HISTORY" },
  { pattern: /\b(close|dismiss|hide)\b/i,                     action: "CLEAR" },
];

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { setActivePanel, dispatchPageAction } = useNavigation();

  const [isListening,  setIsListening]  = useState(false);
  const [voiceStatus,  setVoiceStatus]  = useState<VoiceStatus>("idle");
  const [transcript,   setTranscript]   = useState("");
  const [lastCommand,  setLastCommand]  = useState<string | null>(null);
  const [aiResponse,   setAiResponse]   = useState<string | null>(null);
  const [lastQuery,    setLastQuery]    = useState<string | null>(null);
  const [isThinking,   setIsThinking]   = useState(false);
  const [activeTool,   setActiveTool]   = useState<string | null>(null);
  const [wsConnected,  setWsConnected]  = useState(false);
  const [showInput,    setShowInput]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [history,      setHistory]      = useState<HistoryItem[]>([]);

  // WebRTC refs (Realtime — STT/TTS only)
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const dcRef     = useRef<RTCDataChannel | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Backend agent WebSocket ref
  const agentWsRef       = useRef<WebSocket | null>(null);
  const agentSessionRef  = useRef<string | null>(null);
  const agentResponseRef = useRef<string>("");

  // Prevents the auto-reconnect from firing after an intentional stop
  const manualStop = useRef(false);

  // Pending conversation accumulation (for Realtime TTS path)
  const pendingQueryRef    = useRef<string>("");
  const pendingResponseRef = useRef<{ id: string; text: string } | null>(null);

  // Stable refs so event handler closure never goes stale
  const setActivePanelRef = useRef(setActivePanel);
  const setShowInputRef   = useRef(setShowInput);
  const setSidebarRef     = useRef(setSidebarOpen);
  const clearResponseRef  = useRef<() => void>(() => {});
  useEffect(() => { setActivePanelRef.current = setActivePanel; }, [setActivePanel]);

  const clearResponse = useCallback(() => {
    setAiResponse(null);
    setLastQuery(null);
    setIsThinking(false);
  }, []);
  useEffect(() => { clearResponseRef.current = clearResponse; }, [clearResponse]);

  const clearHistory = useCallback(() => setHistory([]), []);

  // ── Backend Agent WebSocket ───────────────────────────────────────────────
  const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL ?? "ws://localhost:8001/api/v1/agent/ws";

  const connectAgentWs = useCallback(() => {
    if (agentWsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(AGENT_WS_URL);
    agentWsRef.current = ws;

    ws.onopen = () => {
      console.log("[Agent WS] Connected");
      setWsConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "tool_call":
            setActiveTool(msg.name ?? null);
            break;

          case "stream":
            agentResponseRef.current += msg.content ?? "";
            setAiResponse(agentResponseRef.current);
            setIsThinking(false);
            setVoiceStatus("speaking");
            break;

          case "done": {
            clearRequestTimeout();
            agentSessionRef.current = msg.session_id ?? null;
            const fullResponse = agentResponseRef.current;
            const query = pendingQueryRef.current || "…";
            if (fullResponse) {
              setHistory((prev) => [
                ...prev,
                { id: Date.now().toString(), query, written: fullResponse },
              ]);
            }
            agentResponseRef.current = "";
            pendingQueryRef.current = "";
            setActiveTool(null);
            setVoiceStatus("listening");
            setIsListening(true);
            setIsThinking(false);
            setTimeout(() => setLastCommand(null), 2000);

            // Speak the response via Realtime TTS
            if (fullResponse && dcRef.current?.readyState === "open") {
              try {
                dcRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "message",
                    role: "assistant",
                    content: [{ type: "text", text: fullResponse }],
                  },
                }));
                dcRef.current.send(JSON.stringify({ type: "response.create" }));
              } catch {}
            }
            break;
          }

          case "cancelled":
            clearRequestTimeout();
            setActiveTool(null);
            setIsThinking(false);
            setVoiceStatus("listening");
            setIsListening(true);
            pendingQueryRef.current = "";
            agentResponseRef.current = "";
            break;

          case "error":
            clearRequestTimeout();
            console.warn("[Agent WS] Error:", msg.message);
            setActiveTool(null);
            setIsThinking(false);
            setVoiceStatus("listening");
            setLastCommand(null);
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log("[Agent WS] Disconnected \u2014 reconnecting in 3s");
      agentWsRef.current = null;
      setWsConnected(false);
      if (!manualStop.current) {
        setTimeout(() => connectAgentWs(), 3000);
      }
    };

    ws.onerror = () => ws.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timeout ref — auto-cancel after 30s if no response
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRequestTimeout = useCallback(() => {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, []);

  const cancelRequest = useCallback(() => {
    clearRequestTimeout();
    // Tell backend to stop
    const ws = agentWsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: "cancel" })); } catch {}
    }
    // Reset UI immediately
    setIsThinking(false);
    setActiveTool(null);
    setVoiceStatus("listening");
    setIsListening(true);
    pendingQueryRef.current = "";
    agentResponseRef.current = "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRequestTimeout]);

  const sendToAgent = useCallback((transcript: string) => {
    const ws = agentWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[Agent WS] Not open — queuing after reconnect");
      connectAgentWs();
      setTimeout(() => sendToAgent(transcript), 1500);
      return;
    }
    agentResponseRef.current = "";
    ws.send(JSON.stringify({
      type: "query",
      transcript,
      session_id: agentSessionRef.current,
    }));
    // Auto-cancel after 45s if the backend never responds
    clearRequestTimeout();
    requestTimeoutRef.current = setTimeout(() => {
      console.warn("[Agent WS] Request timed out after 45s — auto-cancelling");
      cancelRequest();
    }, 45_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelRequest, clearRequestTimeout]);

  // Connect agent WS on mount, disconnect on unmount
  useEffect(() => {
    connectAgentWs();
    return () => {
      manualStop.current = true;
      agentWsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SSE Navigation Listener ───────────────────────────────────────────────
  useEffect(() => {
    const SSE_URL = "/api/mcp-events";
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(SSE_URL);

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === "navigate" || event.type === "open_panel") {
            const path: string = event.path ?? event.panel ?? "/";
            setActivePanelRef.current(path === "/" ? null : path);

          } else if (event.type === "page_action") {
            // Forward to NavigationProvider so page components can react
            dispatchPageAction({
              page:   event.page,
              action: event.action,
              data:   event.data ?? {},
            } as PageActionEvent);

          } else if (event.type === "notification") {
            setLastCommand(event.message ?? null);
            setTimeout(() => setLastCommand(null), 4000);

          } else if (event.type === "agent_status") {
            if (event.status === "thinking") setIsThinking(true);
            else if (event.status === "done") setIsThinking(false);
          }
        } catch {}
      };

      es.onerror = () => {
        es?.close();
        es = null;
        retryTimer = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      es?.close();
    };
  }, []);

  // ── CLIENT-SIDE FAST PATH ──────────────────────────────────────────
  // Intercepts navigation + greeting commands instantly, skipping the backend.
  // Returns true if the query was handled locally (don't call sendToAgent).
  const checkFastPath = useCallback((userText: string): boolean => {
    const trimmed = userText.trim();

    // 1. Navigation commands
    for (const nav of NAV_COMMANDS) {
      if (nav.pattern.test(trimmed)) {
        const path = nav.path;
        setActivePanelRef.current(path === "BACK" || path === "/" ? null : path);
        // Pick a natural reply from the map
        const replies = NAV_REPLIES[path] ?? ["On it!"];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        setHistory((prev) => [...prev, { id: Date.now().toString(), query: trimmed, written: reply }]);
        setIsThinking(false);
        setVoiceStatus("listening");
        setIsListening(true);
        pendingQueryRef.current = "";
        if (dcRef.current?.readyState === "open") {
          try {
            dcRef.current.send(JSON.stringify({
              type: "conversation.item.create",
              item: { type: "message", role: "assistant", content: [{ type: "text", text: reply }] },
            }));
            dcRef.current.send(JSON.stringify({ type: "response.create" }));
          } catch {}
        }
        return true;
      }
    }

    // 2. Simple greetings
    if (/^(hi+|hello|hey|yo|sup|howdy|bonjour|salut)[\s!?.]*$/i.test(trimmed)) {
      const options = [
        "Hello! How can I help you today?",
        "Hi there! What would you like to explore?",
        "Hey! I'm here — what's on your mind?",
      ];
      const reply = options[Math.floor(Math.random() * options.length)];
      setHistory((prev) => [...prev, { id: Date.now().toString(), query: trimmed, written: reply }]);
      setIsThinking(false);
      setVoiceStatus("listening");
      setIsListening(true);
      pendingQueryRef.current = "";
      if (dcRef.current?.readyState === "open") {
        try {
          dcRef.current.send(JSON.stringify({
            type: "conversation.item.create",
            item: { type: "message", role: "assistant", content: [{ type: "text", text: reply }] },
          }));
          dcRef.current.send(JSON.stringify({ type: "response.create" }));
        } catch {}
      }
      return true;
    }

    return false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime API event handler ──────────────────────────────────────────
  const handleServerEvent = useCallback((event: any) => {
    // Ignore all events after an intentional disconnect
    if (manualStop.current) return;

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

      // Final user transcript — forward to backend agent
      case "conversation.item.input_audio_transcription.completed": {
        const userText = event.transcript?.trim();
        if (!userText) break;

        setTranscript(userText);
        pendingQueryRef.current = userText;
        setLastQuery(userText);

        // UI commands (handled locally)
        for (const cmd of UI_COMMANDS) {
          if (cmd.pattern.test(userText)) {
            if (cmd.action === "KEYBOARD")      setShowInputRef.current(true);
            else if (cmd.action === "MENU")     setSidebarRef.current(true);
            else if (cmd.action === "CLEAR")    clearResponseRef.current();
            else if (cmd.action === "CLEAR_HISTORY") {
              setHistory([]);
              setIsThinking(false);
              setVoiceStatus("listening");
              setIsListening(true);
              pendingQueryRef.current = "";
              return;
            }
            setLastCommand(cmd.action === "KEYBOARD" ? "Show keyboard" : cmd.action === "MENU" ? "Open menu" : "Cleared");
            setTimeout(() => setLastCommand(null), 2000);
            return;
          }
        }

        // Fast path: navigation + greetings handled instantly, no backend needed
        if (checkFastPath(userText)) return;

        // Cancel any Realtime auto-response
        try { dcRef.current?.send(JSON.stringify({ type: "response.cancel" })); } catch {}

        // Complex query — forward to backend MCP agent
        setVoiceStatus("thinking");
        setIsThinking(true);
        sendToAgent(userText);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
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
      if (!tokenRes.ok || tokenData.error) {
        console.warn("[VoiceProvider] Session error:", tokenData.error ?? tokenRes.status);
        pcRef.current = null;
        return;
      }
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) return;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // AI audio output — tear down any previous element first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
        audioRef.current = null;
      }
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => { audioRef.current!.srcObject = e.streams[0]; };

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
        if (manualStop.current) return;
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

  // Disconnect cleanly on unmount
  useEffect(() => {
    return () => { disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public controls ───────────────────────────────────────────────────────
  const startListening = useCallback(() => connect(), [connect]);
  const stopListening  = useCallback(() => disconnect(), [disconnect]);

  const sendTextMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    pendingQueryRef.current = trimmed;
    setLastQuery(trimmed);

    // Fast path: navigation + greetings handled instantly
    if (checkFastPath(trimmed)) return;

    // Complex query — route to backend agent
    setIsThinking(true);
    setVoiceStatus("thinking");
    sendToAgent(trimmed);
  }, [sendToAgent, checkFastPath]);

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
        activeTool,
        wsConnected,
        history,
        clearHistory,
        clearResponse,
        cancelRequest,
        toggleListening,
        startListening,
        stopListening,
        sendTextMessage,
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
