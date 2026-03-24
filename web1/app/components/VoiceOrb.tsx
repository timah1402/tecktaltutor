"use client";
import { useVoice } from "../providers/VoiceProvider";

interface Props {
  size?: "sm" | "md" | "lg";
}

export default function VoiceOrb({ size = "lg" }: Props) {
  const { voiceStatus, toggleListening, isListening, isThinking } = useVoice();
  const isProcessing = voiceStatus === "processing";
  const isSpeaking = voiceStatus === "speaking";

  const dimensions = { sm: 120, md: 160, lg: 200 };
  const dim = dimensions[size];
  const barCount = size === "sm" ? 5 : 7;

  const statusLabel = isThinking
    ? "Thinking…"
    : isSpeaking
    ? "Speaking…"
    : isProcessing
    ? "Processing…"
    : isListening
    ? "Listening"
    : "Tap to start";

  const orbActive = isListening || isThinking || isSpeaking;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ width: dim + 80, height: dim + 80 }}
      onClick={toggleListening}
      title={statusLabel}
    >
      {/* Outer pulse ring */}
      <div
        className="absolute rounded-full border border-blue-300/40 animate-ring-pulse"
        style={{ width: dim + 70, height: dim + 70, animationDelay: "0s" }}
      />
      {/* Mid pulse ring */}
      <div
        className="absolute rounded-full border border-blue-400/30 animate-ring-pulse"
        style={{ width: dim + 40, height: dim + 40, animationDelay: "0.5s" }}
      />

      {/* Processing spinner */}
      {isProcessing && (
        <div
          className="absolute rounded-full animate-spin-slow"
          style={{
            width: dim + 12,
            height: dim + 12,
            background: "conic-gradient(from 0deg, transparent 0%, #4f8ef7 60%, transparent 100%)",
            borderRadius: "50%",
            padding: "2px",
          }}
        />
      )}

      {/* Speaking spinner (violet) */}
      {isSpeaking && (
        <div
          className="absolute rounded-full animate-spin-slow"
          style={{
            width: dim + 12,
            height: dim + 12,
            background: "conic-gradient(from 0deg, transparent 0%, #7c5ef8 60%, transparent 100%)",
            borderRadius: "50%",
            padding: "2px",
            animationDirection: "reverse",
          }}
        />
      )}

      {/* Main orb */}
      <div
        className="relative z-10 rounded-full flex items-center justify-center transition-all duration-500"
        style={{
          width: dim,
          height: dim,
          background: isSpeaking
            ? "linear-gradient(145deg, #d4c8ff, #c0b0f8)"
            : orbActive
            ? "linear-gradient(145deg, #d0e3ff, #bcd3f8)"
            : "linear-gradient(145deg, #dce8fc, #c8d9f5)",
          boxShadow: isSpeaking
            ? "8px 8px 22px rgba(124,94,248,0.5), -6px -6px 18px rgba(255,255,255,0.9), 0 0 40px rgba(124,94,248,0.22)"
            : orbActive
            ? "8px 8px 22px rgba(120,160,240,0.55), -6px -6px 18px rgba(255,255,255,0.9), 0 0 40px rgba(79,142,247,0.25)"
            : "8px 8px 20px rgba(150,175,220,0.45), -6px -6px 16px rgba(255,255,255,0.85)",
          border: isSpeaking
            ? "1.5px solid rgba(124,94,248,0.4)"
            : isListening
            ? "1.5px solid rgba(79,142,247,0.4)"
            : "1.5px solid rgba(255,255,255,0.7)",
        }}
      >
        {isThinking ? (
          /* Thinking: 3 dots */
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full bg-blue-400 animate-typing-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : (
          /* Waveform bars — animate when listening OR speaking */
          <div className="flex items-center gap-[3px]" style={{ height: dim * 0.28 }}>
            {Array.from({ length: barCount }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 bar-${i + 1} ${
                  isListening || isSpeaking ? "animate-bar-wave" : ""
                }`}
                style={{
                  width: size === "sm" ? "3px" : "4px",
                  height: "100%",
                  background:
                    isSpeaking
                      ? "linear-gradient(to top, #7c5ef8, #a78bfa)"
                      : isListening
                      ? "linear-gradient(to top, #4f8ef7, #8ab4fc)"
                      : "rgba(100,140,220,0.25)",
                  transform: isListening || isSpeaking ? undefined : "scaleY(0.25)",
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status label */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium tracking-wider uppercase transition-all duration-300 whitespace-nowrap"
        style={{
          color: isSpeaking ? "#7c5ef8" : orbActive ? "#4f8ef7" : "#94a3b8",
        }}
      >
        {statusLabel}
      </div>
    </div>
  );
}
