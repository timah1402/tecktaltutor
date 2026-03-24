"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Microscope, PenTool, GraduationCap, Edit3,
  Calculator, Lightbulb, BookOpen, Book, PhoneCall, Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import AppShell from "./components/AppShell";
import VoiceOrb from "./components/VoiceOrb";
import GlassCard from "./components/GlassCard";
import { useVoice } from "./providers/VoiceProvider";

const QUICK_ACTIONS = [
  { label: "Research",  icon: Microscope,    href: "/research",   color: "#4f8ef7", bg: "rgba(79,142,247,0.1)" },
  { label: "Questions", icon: PenTool,       href: "/question",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { label: "Solver",    icon: Calculator,    href: "/solver",     color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  { label: "Co-Writer", icon: Edit3,         href: "/co_writer",  color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "Learning",  icon: GraduationCap, href: "/guide",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { label: "IdeaGen",   icon: Lightbulb,     href: "/ideagen",    color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { label: "Knowledge", icon: BookOpen,      href: "/knowledge",  color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  { label: "Notebooks", icon: Book,          href: "/notebook",   color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
  { label: "Voice",     icon: PhoneCall,     href: "/voice",      color: "#4f8ef7", bg: "rgba(79,142,247,0.1)" },
];

export default function HomePage() {
  const router = useRouter();
  const { voiceStatus, transcript, history, clearHistory, isThinking, lastQuery } = useVoice();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest answer
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isThinking]);

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT PANEL: Voice + Quick Actions ─────────────── */}
        <div
          className="flex flex-col items-center gap-5 px-4 py-4 overflow-y-auto shrink-0"
          style={{
            width: 280,
            borderRight: "1px solid rgba(200,220,255,0.4)",
          }}
        >
          {/* Orb */}
          <VoiceOrb size="md" />

          {/* Transcript */}
          <div className="min-h-[28px] flex items-center justify-center w-full">
            {voiceStatus === "listening" && transcript ? (
              <p className="text-xs text-slate-500 text-center animate-fade-in italic px-2">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : voiceStatus === "listening" ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing-dot"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 tracking-wide text-center">
                Always listening — just speak
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="w-full">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5 px-1">
              Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <GlassCard
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  glow="blue"
                  className="p-2.5 flex flex-col items-center gap-1"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: action.bg }}>
                    <action.icon size={15} style={{ color: action.color }} />
                  </div>
                  <span className="text-[9.5px] text-slate-500 text-center leading-tight font-medium">
                    {action.label}
                  </span>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Voice hint */}
          <GlassCard className="px-3 py-2.5 w-full">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Say <span className="text-blue-500 font-medium">&quot;research&quot;</span> ·{" "}
              <span className="text-blue-500 font-medium">&quot;solver&quot;</span> ·{" "}
              <span className="text-blue-500 font-medium">&quot;go back&quot;</span>
            </p>
          </GlassCard>
        </div>

        {/* ── RIGHT PANEL: Chat History ──────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}
          >
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Conversation
              </p>
              {history.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {history.length} answer{history.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50/60 transition-colors text-[11px]"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            {history.length === 0 && !isThinking ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)" }}
                >
                  <Microscope size={24} style={{ color: "rgba(79,142,247,0.5)" }} />
                </div>
                <p className="text-sm font-medium text-slate-400">Ask anything</p>
                <p className="text-[11px] text-slate-300 max-w-[220px] leading-relaxed">
                  Speak a question and the full answer will appear here, with math and formatting
                </p>
              </div>
            ) : (
              <>
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 animate-fade-up">
                    {/* Question bubble */}
                    <div className="flex justify-end">
                      <div
                        className="px-3.5 py-2 rounded-2xl rounded-br-sm text-[12.5px] font-medium max-w-[85%]"
                        style={{
                          background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)",
                          color: "#fff",
                        }}
                      >
                        {item.query}
                      </div>
                    </div>

                    {/* Answer card */}
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3.5"
                      style={{
                        background: "rgba(255,255,255,0.75)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(200,220,255,0.5)",
                        boxShadow: "0 4px 20px rgba(100,130,200,0.08)",
                      }}
                    >
                      <div className="prose-response">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {item.written}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex flex-col gap-2 animate-fade-up">
                    {lastQuery && (
                      <div className="flex justify-end">
                        <div
                          className="px-3.5 py-2 rounded-2xl rounded-br-sm text-[12.5px] font-medium max-w-[85%] opacity-70"
                          style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)", color: "#fff" }}
                        >
                          {lastQuery}
                        </div>
                      </div>
                    )}
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3.5"
                      style={{
                        background: "rgba(255,255,255,0.75)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(200,220,255,0.5)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-typing-dot"
                            style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                        <span className="text-xs text-slate-400 ml-1">Thinking…</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {[75, 90, 55].map((w, i) => (
                          <div key={i} className="h-2.5 rounded-full bg-slate-100 animate-pulse"
                            style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
