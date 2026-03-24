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

export type VoiceStatus = "idle" | "listening" | "processing" | "thinking";

interface VoiceCtx {
  isListening: boolean;
  voiceStatus: VoiceStatus;
  transcript: string;
  lastCommand: string | null;
  aiResponse: string | null;
  lastQuery: string | null;
  isThinking: boolean;
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
  { pattern: /\b(go home|open home|home|dashboard)\b/i, path: "/", label: "→ Home" },
  { pattern: /\b(go back|back|previous page|return)\b/i, path: "BACK", label: "← Go Back" },
  { pattern: /\b(history|past sessions|conversations)\b/i, path: "/history", label: "→ History" },
  { pattern: /\b(knowledge|knowledge base|documents)\b/i, path: "/knowledge", label: "→ Knowledge Base" },
  { pattern: /\b(notebook|notes|note)\b/i, path: "/notebook", label: "→ Notebooks" },
  { pattern: /\b(question generator|questions|generate questions)\b/i, path: "/question", label: "→ Question Generator" },
  { pattern: /\b(smart solver|solver|solve|math)\b/i, path: "/solver", label: "→ Smart Solver" },
  { pattern: /\b(guided learning|learning|guide|learn)\b/i, path: "/guide", label: "→ Guided Learning" },
  { pattern: /\b(idea gen|ideagen|ideas|brainstorm)\b/i, path: "/ideagen", label: "→ IdeaGen" },
  { pattern: /\b(deep research|research)\b/i, path: "/research", label: "→ Deep Research" },
  { pattern: /\b(co.?writer|writing|co write)\b/i, path: "/co_writer", label: "→ Co-Writer" },
  { pattern: /\b(settings|preferences)\b/i, path: "/settings", label: "→ Settings" },
];

const UI_COMMANDS = [
  { pattern: /\b(type|keyboard|show keyboard|text input)\b/i, action: "KEYBOARD" },
  { pattern: /\b(open menu|menu|navigation|sidebar)\b/i, action: "MENU" },
  { pattern: /\b(close|dismiss|clear|hide)\b/i, action: "CLEAR" },
  { pattern: /\b(upload|attach|file|document)\b/i, action: "UPLOAD" },
];

async function askOpenAI(message: string): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.answer ?? "Sorry, I could not get a response.";
  } catch {
    return "Sorry, something went wrong.";
  }
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStop = useRef(false);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResponse = useCallback(() => {
    setAiResponse(null);
    setLastQuery(null);
    setIsThinking(false);
  }, []);

  const processText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Check UI commands first
      for (const cmd of UI_COMMANDS) {
        if (cmd.pattern.test(trimmed)) {
          if (cmd.action === "KEYBOARD") {
            setShowInput(true);
            setLastCommand("Show keyboard");
          } else if (cmd.action === "MENU") {
            setSidebarOpen(true);
            setLastCommand("Open menu");
          } else if (cmd.action === "CLEAR") {
            clearResponse();
            setLastCommand("Cleared");
          }
          setTimeout(() => setLastCommand(null), 2000);
          return;
        }
      }

      // Check nav commands
      for (const cmd of NAV_COMMANDS) {
        if (cmd.pattern.test(trimmed)) {
          setLastCommand(cmd.label);
          setVoiceStatus("processing");
          setSidebarOpen(false);
          setTimeout(() => {
            if (cmd.path === "BACK") {
              router.back();
            } else {
              router.push(cmd.path);
            }
            setVoiceStatus("listening");
            setTimeout(() => setLastCommand(null), 2000);
          }, 350);
          return;
        }
      }

      // Otherwise: send to OpenAI as a question/search
      setLastQuery(trimmed);
      setIsThinking(true);
      setVoiceStatus("thinking");
      const answer = await askOpenAI(trimmed);
      setAiResponse(answer);
      setIsThinking(false);
      setVoiceStatus("listening");
    },
    [router, clearResponse]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      setVoiceStatus("listening");
      setTranscript("");
    };

    rec.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const text = final || interim;
      setTranscript(text);
      if (final) processText(final);
    };

    rec.onerror = (e: any) => {
      if (e.error === "aborted") return;
      setIsListening(false);
      setVoiceStatus("idle");
      // auto-restart on error unless manual stop
      if (!manualStop.current) {
        restartTimer.current = setTimeout(() => startListening(), 1500);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      // auto-restart unless manual stop
      if (!manualStop.current) {
        restartTimer.current = setTimeout(() => startListening(), 300);
      } else {
        setVoiceStatus("idle");
      }
    };

    recognitionRef.current = rec;
    manualStop.current = false;
    try { rec.start(); } catch {}
  }, [processText]);

  const stopListening = useCallback(() => {
    manualStop.current = true;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus("idle");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || voiceStatus === "thinking") {
      stopListening();
    } else {
      manualStop.current = false;
      startListening();
    }
  }, [isListening, voiceStatus, startListening, stopListening]);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      manualStop.current = false;
      startListening();
    }, 800);
    return () => {
      clearTimeout(timer);
      if (restartTimer.current) clearTimeout(restartTimer.current);
      manualStop.current = true;
      recognitionRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
