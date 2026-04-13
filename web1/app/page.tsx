"use client";
import { useEffect, useRef, useState } from "react";
import {
  Microscope, PenTool, GraduationCap, Edit3,
  Calculator, Lightbulb, BookOpen, Book, PhoneCall, Trash2,
  ArrowLeft, Home, History,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "./components/AppShell";
import VoiceOrb from "./components/VoiceOrb";
import GlassCard from "./components/GlassCard";
import InputBar from "./components/InputBar";
import ResearchPage   from "./research/page";
import QuestionPage   from "./question/page";
import SolverPage     from "./solver/page";
import CoWriterPage   from "./co_writer/page";
import GuidePage      from "./guide/page";
import IdeaGenPage    from "./ideagen/page";
import KnowledgePage  from "./knowledge/page";
import NotebookPage   from "./notebook/page";
import VoicePage      from "./voice/page";
import HistoryPage    from "./history/page";
import { useVoice } from "./providers/VoiceProvider";

const MOCK_KBS = [
  "All Knowledge Bases",
  "Physics Notes",
  "Math Formulas",
  "History Essays",
  "Biology Textbook",
];

const QUICK_ACTIONS = [
  { label: "Home",      icon: Home,          href: "/",           color: "#4f8ef7", bg: "rgba(79,142,247,0.1)"  },
  { label: "History",   icon: History,       href: "/history",    color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  { label: "Research",  icon: Microscope,    href: "/research",   color: "#4f8ef7", bg: "rgba(79,142,247,0.1)"  },
  { label: "Questions", icon: PenTool,       href: "/question",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { label: "Solver",    icon: Calculator,    href: "/solver",     color: "#06b6d4", bg: "rgba(6,182,212,0.1)"  },
  { label: "Co-Writer", icon: Edit3,         href: "/co_writer",  color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "Learning",  icon: GraduationCap, href: "/guide",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { label: "IdeaGen",   icon: Lightbulb,     href: "/ideagen",    color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { label: "Knowledge", icon: BookOpen,      href: "/knowledge",  color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  { label: "Notebooks", icon: Book,          href: "/notebook",   color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
  { label: "Voice",     icon: PhoneCall,     href: "/voice",      color: "#4f8ef7", bg: "rgba(79,142,247,0.1)" },
];

// Renders the real page component embedded (no AppShell wrapper)
function getPanelContent(href: string) {
  switch (href) {
    case "/history":  return <HistoryPage   isEmbedded />;
    case "/research":  return <ResearchPage  isEmbedded />;
    case "/question":  return <QuestionPage  isEmbedded />;
    case "/solver":    return <SolverPage    isEmbedded />;
    case "/co_writer": return <CoWriterPage  isEmbedded />;
    case "/guide":     return <GuidePage     isEmbedded />;
    case "/ideagen":   return <IdeaGenPage   isEmbedded />;
    case "/knowledge": return <KnowledgePage isEmbedded />;
    case "/notebook":  return <NotebookPage  isEmbedded />;
    case "/voice":     return <VoicePage     isEmbedded />;
    default:           return null;
  }
}

export default function HomePage() {
  const { voiceStatus, transcript, history, clearHistory, isThinking, lastQuery } = useVoice();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [selectedKb, setSelectedKb]   = useState(MOCK_KBS[0]);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Keep the last active panel so it can animate out after activePanel → null
  const lastPanelRef = useRef<string | null>(null);
  if (activePanel) lastPanelRef.current = activePanel;
  const visibleHref   = activePanel ?? lastPanelRef.current;
  const visibleAction = QUICK_ACTIONS.find((a) => a.href === visibleHref);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isThinking]);

  return (
    <AppShell hideInputBar>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT PANEL: Voice + Quick Actions (always visible) ── */}
        <div
          className="flex flex-col items-center gap-5 px-4 py-4 overflow-y-auto shrink-0"
          style={{ width: 280, borderRight: "1px solid rgba(200,220,255,0.4)" }}
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
                  onClick={() => action.href === "/" ? setActivePanel(null) : setActivePanel(action.href)}
                  glow="blue"
                  className="p-2.5 flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: activePanel === action.href ? action.bg + "cc" : action.bg }}
                  >
                    <action.icon size={15} style={{ color: action.color }} />
                  </div>
                  <span className="text-[9.5px] text-slate-500 text-center leading-tight font-medium">
                    {action.label}
                  </span>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Knowledge Base selector */}
          <div className="w-full">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5 px-1">
              RAG Provider
            </p>
            <GlassCard className="px-3 py-2 w-full">
              <p className="text-[10px] text-slate-400 mb-1.5">Knowledge Base</p>
              <select
                value={selectedKb}
                onChange={(e) => setSelectedKb(e.target.value)}
                className="w-full text-[11px] text-slate-600 bg-transparent outline-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(200,220,255,0.5)",
                  borderRadius: 8,
                  padding: "5px 8px",
                }}
              >
                {MOCK_KBS.map((kb) => (
                  <option key={kb} value={kb}>{kb}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400">
                  {selectedKb === MOCK_KBS[0] ? "All sources active" : "1 source active"}
                </span>
              </div>
            </GlassCard>
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

        {/* ── RIGHT PANEL: Conversation + Action Overlay ──────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minWidth: 0 }}>

          {/* ── Conversation ──────────────────────────────────── */}
          <div
            className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
            style={{ opacity: activePanel ? 0.15 : 1, pointerEvents: activePanel ? "none" : "auto" }}
          >
            {/* Header */}
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
                      <div className="flex justify-end">
                        <div
                          className="px-3.5 py-2 rounded-2xl rounded-br-sm text-[12.5px] font-medium max-w-[85%]"
                          style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)", color: "#fff" }}
                        >
                          {item.query}
                        </div>
                      </div>
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
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                            {item.written}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}

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
                        style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(200,220,255,0.5)" }}
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

          {/* ── Action Slide Panel (over conversation, within right area) ── */}
          {visibleAction && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(246,249,255,0.98) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                // Slide in from right
                transform: activePanel ? "translateX(0)" : "translateX(100%)",
                transition: "transform 380ms cubic-bezier(0.32, 0.72, 0, 1)",
                // Subtle left border to show separation from sidebar
                borderLeft: `3px solid ${visibleAction.color}44`,
                boxShadow: "-12px 0 40px rgba(10,18,40,0.08)",
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {/* Sticky panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "13px 18px",
                  borderBottom: "1px solid rgba(200,220,255,0.5)",
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(20px)",
                  flexShrink: 0,
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                {/* Back button */}
                <button
                  onClick={() => setActivePanel(null)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                  style={{
                    padding: "5px 11px 5px 8px",
                    borderRadius: 9,
                    border: "1px solid rgba(200,220,255,0.8)",
                    background: "rgba(248,250,255,0.95)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <ArrowLeft size={13} />
                  Back
                </button>

                {/* Divider */}
                <span style={{ width: 1, height: 20, background: "rgba(200,220,255,0.9)", flexShrink: 0 }} />

                {/* Icon */}
                <div
                  style={{
                    width: 30, height: 30,
                    borderRadius: 9,
                    background: visibleAction.color + "1c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <visibleAction.icon size={15} style={{ color: visibleAction.color }} />
                </div>

                {/* Title */}
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", flex: 1, lineHeight: 1 }}>
                  {visibleAction.label}
                </span>

                {/* Accent dot */}
                <div
                  style={{ width: 8, height: 8, borderRadius: "50%", background: visibleAction.color, flexShrink: 0 }}
                />
              </div>

              {/* Scrollable content — stagger-animates on open */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  opacity: activePanel ? 1 : 0,
                  transform: activePanel ? "translateY(0)" : "translateY(10px)",
                  transition: activePanel
                    ? "opacity 300ms ease 200ms, transform 300ms ease 200ms"
                    : "none",
                }}
              >
                {/* Only mount content when panel is open so stagger animations replay */}
                {activePanel && getPanelContent(activePanel)}
              </div>
            </div>
          )}

          {/* Input bar — scoped to the conversation column */}
          <InputBar />
        </div>
      </div>
    </AppShell>
  );
}
