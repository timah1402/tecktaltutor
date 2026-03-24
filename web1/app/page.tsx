"use client";
import { useRouter } from "next/navigation";
import {
  Microscope, PenTool, GraduationCap, Edit3,
  Calculator, Lightbulb, BookOpen, Book, X,
} from "lucide-react";
import AppShell from "./components/AppShell";
import VoiceOrb from "./components/VoiceOrb";
import GlassCard from "./components/GlassCard";
import { useVoice } from "./providers/VoiceProvider";

const QUICK_ACTIONS = [
  { label: "Research", icon: Microscope, href: "/research", color: "#4f8ef7", bg: "rgba(79,142,247,0.1)" },
  { label: "Questions", icon: PenTool, href: "/question", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { label: "Solver", icon: Calculator, href: "/solver", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  { label: "Co-Writer", icon: Edit3, href: "/co_writer", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "Learning", icon: GraduationCap, href: "/guide", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { label: "IdeaGen", icon: Lightbulb, href: "/ideagen", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { label: "Knowledge", icon: BookOpen, href: "/knowledge", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  { label: "Notebooks", icon: Book, href: "/notebook", color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
];

export default function HomePage() {
  const router = useRouter();
  const { voiceStatus, transcript, aiResponse, lastQuery, isThinking, clearResponse } = useVoice();

  return (
    <AppShell>
      <div className="flex flex-col items-center px-4 pt-4 pb-4 gap-7 animate-fade-up">

        {/* Voice Orb */}
        <div className="flex flex-col items-center mt-2">
          <VoiceOrb size="lg" />
          {/* Live transcript */}
          <div className="mt-10 min-h-[32px] flex items-center justify-center">
            {voiceStatus === "listening" && transcript ? (
              <p className="text-sm text-slate-500 max-w-[260px] text-center animate-fade-in italic">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : voiceStatus === "listening" ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 tracking-wide">
                Always listening — just speak
              </p>
            )}
          </div>
        </div>

        {/* AI Response Panel */}
        {(isThinking || aiResponse) && (
          <div className="w-full max-w-sm animate-fade-up">
            <div
              className="rounded-2xl p-4 relative"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 8px 32px rgba(100,130,200,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
                border: "1px solid rgba(255,255,255,0.85)",
              }}
            >
              {/* Dismiss */}
              {aiResponse && (
                <button
                  onClick={clearResponse}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X size={12} className="text-slate-400" />
                </button>
              )}
              {lastQuery && (
                <p className="text-[11px] text-slate-400 mb-2 pr-6 italic">&ldquo;{lastQuery}&rdquo;</p>
              )}
              {isThinking ? (
                <div className="flex items-center gap-2 py-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-blue-400 animate-typing-dot"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">Thinking…</span>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">{aiResponse}</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="w-full max-w-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Quick Actions
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <GlassCard
                key={action.href}
                onClick={() => router.push(action.href)}
                glow="blue"
                className="p-3 flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: action.bg }}
                >
                  <action.icon size={17} style={{ color: action.color }} />
                </div>
                <span className="text-[10px] text-slate-500 text-center leading-tight font-medium">
                  {action.label}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Voice hints */}
        <div className="w-full max-w-sm">
          <GlassCard className="px-4 py-3">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Say <span className="text-blue-500 font-medium">&quot;open research&quot;</span> · <span className="text-blue-500 font-medium">&quot;go back&quot;</span> · <span className="text-blue-500 font-medium">&quot;open menu&quot;</span> · or ask any question
            </p>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
