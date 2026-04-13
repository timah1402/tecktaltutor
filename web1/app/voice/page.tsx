"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, PhoneOff, Phone } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type Status = "idle" | "connecting" | "connected" | "error";
type Message = { id: string; role: "user" | "assistant"; text: string };

const VOICES = ["alloy", "echo", "shimmer", "nova", "onyx", "fable", "coral"] as const;
type Voice = (typeof VOICES)[number];

export default function VoicePage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [voice, setVoice] = useState<Voice>("alloy");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleServerEvent = useCallback((event: any) => {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsUserSpeaking(true);
        break;
      case "input_audio_buffer.speech_stopped":
        setIsUserSpeaking(false);
        break;
      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript?.trim()) {
          setMessages((prev) => [
            ...prev,
            { id: event.item_id ?? Date.now().toString(), role: "user", text: event.transcript.trim() },
          ]);
        }
        break;
      case "response.audio_transcript.delta":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === event.item_id) {
            return [...prev.slice(0, -1), { ...last, text: last.text + event.delta }];
          }
          return [...prev, { id: event.item_id ?? Date.now().toString(), role: "assistant", text: event.delta }];
        });
        break;
      case "response.audio.started":
        setIsSpeaking(true);
        break;
      case "response.audio.done":
      case "response.audio_transcript.done":
        setIsSpeaking(false);
        break;
    }
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setErrorMsg(null);

    try {
      const tokenRes = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice }),
      });
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error(tokenData.error?.message ?? "Failed to get session token");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;

      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try {
          handleServerEvent(JSON.parse(e.data));
        } catch {}
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
        const errText = await sdpRes.text();
        throw new Error(`OpenAI error: ${errText}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setStatus("connected");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Connection failed");
      // cleanup
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
      streamRef.current = null;
    }
  }, [voice, handleServerEvent]);

  const disconnect = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    pcRef.current = null;
    dcRef.current = null;
    streamRef.current = null;
    setStatus("idle");
    setIsSpeaking(false);
    setIsUserSpeaking(false);
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const orbActive = isConnected && (isSpeaking || isUserSpeaking);

  const _inner = (
      <div className="flex flex-col items-center px-4 pt-4 pb-6 gap-5 animate-fade-up">

        {/* Title */}
        <div className="text-center mt-1">
          <h1 className="text-[17px] font-bold text-slate-700 tracking-tight">Voice Conversation</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Full-duplex AI tutor — speak naturally, interrupt anytime</p>
        </div>

        {/* Orb */}
        <div className="flex flex-col items-center" style={{ marginTop: 8 }}>
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            {/* Pulse rings */}
            {orbActive && (
              <>
                <div
                  className="absolute rounded-full border border-blue-300/40 animate-ring-pulse"
                  style={{ width: 270, height: 270, animationDelay: "0s" }}
                />
                <div
                  className="absolute rounded-full border border-blue-400/30 animate-ring-pulse"
                  style={{ width: 248, height: 248, animationDelay: "0.5s" }}
                />
              </>
            )}

            {/* Main orb */}
            <div
              className="relative z-10 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                width: 200,
                height: 200,
                background: isConnected
                  ? isSpeaking
                    ? "linear-gradient(145deg, #b8d4ff, #a0c0f8)"
                    : isUserSpeaking
                    ? "linear-gradient(145deg, #c5d8ff, #b0c8f8)"
                    : "linear-gradient(145deg, #d0e3ff, #bcd3f8)"
                  : "linear-gradient(145deg, #dce8fc, #c8d9f5)",
                boxShadow: isConnected
                  ? isSpeaking
                    ? "8px 8px 22px rgba(79,142,247,0.65), -6px -6px 18px rgba(255,255,255,0.9), 0 0 60px rgba(79,142,247,0.3)"
                    : isUserSpeaking
                    ? "8px 8px 22px rgba(124,94,248,0.55), -6px -6px 18px rgba(255,255,255,0.9), 0 0 50px rgba(124,94,248,0.2)"
                    : "8px 8px 22px rgba(120,160,240,0.5), -6px -6px 18px rgba(255,255,255,0.9), 0 0 35px rgba(79,142,247,0.18)"
                  : "8px 8px 20px rgba(150,175,220,0.45), -6px -6px 16px rgba(255,255,255,0.85)",
                border: isConnected
                  ? isSpeaking
                    ? "1.5px solid rgba(79,142,247,0.45)"
                    : isUserSpeaking
                    ? "1.5px solid rgba(124,94,248,0.4)"
                    : "1.5px solid rgba(79,142,247,0.3)"
                  : "1.5px solid rgba(255,255,255,0.7)",
              }}
            >
              {isConnecting ? (
                <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              ) : isConnected ? (
                <div className="flex items-center gap-[4px]" style={{ height: 56 }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 bar-${i + 1} ${
                        orbActive ? "animate-bar-wave" : ""
                      }`}
                      style={{
                        width: "4px",
                        height: "100%",
                        background: orbActive
                          ? isSpeaking
                            ? "linear-gradient(to top, #4f8ef7, #8ab4fc)"
                            : "linear-gradient(to top, #7c5ef8, #a78bfa)"
                          : "rgba(100,140,220,0.22)",
                        transform: orbActive ? undefined : "scaleY(0.22)",
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Phone size={42} style={{ color: "rgba(79,142,247,0.55)" }} />
              )}
            </div>

            {/* Status label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-colors duration-300"
              style={{
                bottom: -28,
                color: isConnected
                  ? isSpeaking
                    ? "#4f8ef7"
                    : isUserSpeaking
                    ? "#7c5ef8"
                    : "#94a3b8"
                  : "#94a3b8",
              }}
            >
              {isConnecting
                ? "Connecting…"
                : isConnected
                ? isSpeaking
                  ? "AI Speaking"
                  : isUserSpeaking
                  ? "You're speaking"
                  : "Listening…"
                : "Ready to connect"}
            </div>
          </div>
        </div>

        {/* Voice selector + connect button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm mt-6">
          {/* Voice selector — only when disconnected */}
          {!isConnected && !isConnecting && (
            <GlassCard className="px-4 py-3 w-full">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Choose Voice
              </p>
              <div className="flex flex-wrap gap-2">
                {VOICES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVoice(v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all active:scale-95 ${
                      voice === v
                        ? "text-white shadow-md"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    style={
                      voice === v
                        ? { background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }
                        : { background: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Call button */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className="flex items-center gap-2.5 px-9 py-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={
              isConnected
                ? {
                    background: "rgba(254,226,226,0.8)",
                    color: "#dc2626",
                    border: "1px solid rgba(252,165,165,0.5)",
                  }
                : {
                    background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(79,142,247,0.4)",
                  }
            }
          >
            {isConnected ? (
              <>
                <PhoneOff size={16} />
                End Conversation
              </>
            ) : isConnecting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Mic size={16} />
                Start Conversation
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-xs text-red-500 text-center px-2">{errorMsg}</p>
          )}

          {/* Tip */}
          {isConnected && (
            <p className="text-[11px] text-slate-400 text-center">
              Speak naturally — you can interrupt at any time
            </p>
          )}
        </div>

        {/* Transcript */}
        {messages.length > 0 && (
          <div className="w-full max-w-sm flex flex-col gap-2 pb-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">
              Transcript
            </p>
            <div className="glass rounded-2xl p-3 max-h-52 overflow-y-auto flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div
                  key={`${msg.id}-${i}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)",
                            color: "#fff",
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background: "rgba(255,255,255,0.75)",
                            color: "#334155",
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell>{_inner}</AppShell>;
}
