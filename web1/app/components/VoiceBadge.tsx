"use client";
import { useVoice } from "../providers/VoiceProvider";

export default function VoiceBadge() {
  const { lastCommand, voiceStatus, transcript, isThinking } = useVoice();

  if (!lastCommand && voiceStatus !== "listening" && !isThinking) return null;
  if (!lastCommand && !transcript && !isThinking) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {lastCommand ? (
        <div
          className="animate-command-pop flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(79,142,247,0.3)",
            boxShadow: "0 4px 20px rgba(79,142,247,0.2)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-medium text-blue-600">{lastCommand}</span>
        </div>
      ) : transcript && voiceStatus === "listening" ? (
        <div
          className="animate-fade-up flex items-center gap-2 px-4 py-2 rounded-full shadow-md max-w-xs"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.9)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-600 truncate">{transcript}</span>
        </div>
      ) : null}
    </div>
  );
}
