"use client";
import { useEffect, useRef, useState } from "react";
import {
  Microscope, PenTool, GraduationCap, Edit3,
  Calculator, Lightbulb, BookOpen, Book, PhoneCall, Trash2,
  Home, History, ChevronLeft, ChevronRight, MessageSquare,
  Wrench, WifiOff,
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
import { useVoice }      from "./providers/VoiceProvider";
import { useNavigation } from "./providers/NavigationProvider";

const MOCK_KBS = ["All Knowledge Bases","Physics Notes","Math Formulas","History Essays","Biology Textbook"];

const QUICK_ACTIONS = [
  { label:"Home",      icon:Home,          href:"/",           color:"#4f8ef7", bg:"rgba(79,142,247,0.12)"  },
  { label:"History",   icon:History,       href:"/history",    color:"#64748b", bg:"rgba(100,116,139,0.12)" },
  { label:"Research",  icon:Microscope,    href:"/research",   color:"#4f8ef7", bg:"rgba(79,142,247,0.12)"  },
  { label:"Questions", icon:PenTool,       href:"/question",   color:"#8b5cf6", bg:"rgba(139,92,246,0.12)"  },
  { label:"Solver",    icon:Calculator,    href:"/solver",     color:"#06b6d4", bg:"rgba(6,182,212,0.12)"   },
  { label:"Co-Writer", icon:Edit3,         href:"/co_writer",  color:"#10b981", bg:"rgba(16,185,129,0.12)"  },
  { label:"Learning",  icon:GraduationCap, href:"/guide",      color:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  { label:"IdeaGen",   icon:Lightbulb,     href:"/ideagen",    color:"#ec4899", bg:"rgba(236,72,153,0.12)"  },
  { label:"Knowledge", icon:BookOpen,      href:"/knowledge",  color:"#6366f1", bg:"rgba(99,102,241,0.12)"  },
  { label:"Notebooks", icon:Book,          href:"/notebook",   color:"#14b8a6", bg:"rgba(20,184,166,0.12)"  },
  { label:"Voice",     icon:PhoneCall,     href:"/voice",      color:"#4f8ef7", bg:"rgba(79,142,247,0.12)"  },
];

function getPanelContent(href: string) {
  switch (href) {
    case "/history":   return <HistoryPage   isEmbedded />;
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

function toolLabel(name: string) {
  return name.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase());
}

export default function HomePage() {
  const { voiceStatus, transcript, history, clearHistory, isThinking, lastQuery, activeTool, wsConnected } = useVoice();
  const { activePanel, setActivePanel, chatPanelOpen, setChatPanelOpen } = useNavigation();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedKb, setSelectedKb] = useState(MOCK_KBS[0]);
  // Left nav sidebar: auto-collapses when panel opens
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (activePanel) {
      setNavOpen(false);
    } else {
      setNavOpen(true);
      setChatPanelOpen(true); // always restore full chat when going home
    }
  }, [activePanel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [history, isThinking]);

  const lastPanelRef = useRef<string|null>(null);
  if (activePanel) lastPanelRef.current = activePanel;
  const visibleHref   = activePanel ?? lastPanelRef.current;
  const visibleAction = QUICK_ACTIONS.find((a) => a.href === visibleHref);

  // ── Left sidebar: collapsed icon rail ────────────────────────────────────
  const navCollapsed = (
    <div className="flex flex-col items-center py-3 gap-1 overflow-y-auto"
      style={{ width:52, borderRight:"1px solid rgba(200,220,255,0.4)", flexShrink:0 }}>
      {/* Brand icon */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 shrink-0"
        style={{ background:"linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow:"0 3px 10px rgba(79,142,247,0.35)" }}>
        <span className="text-white font-bold text-sm">T</span>
      </div>
      {/* Expand button */}
      <button onClick={()=>setNavOpen(true)} title="Expand sidebar"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors mb-1"
        style={{ color:"#94a3b8" }}>
        <ChevronRight size={14} />
      </button>
      <div className="w-5 h-px bg-slate-200 mb-1" />
      {/* Page icon buttons */}
      {QUICK_ACTIONS.map((a) => (
        <button key={a.href} title={a.label}
          onClick={() => a.href==="/" ? setActivePanel(null) : setActivePanel(a.href)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: activePanel===a.href ? a.bg+"ee" : a.bg }}>
          <a.icon size={14} style={{ color: a.color }} />
        </button>
      ))}
    </div>
  );

  // ── Left sidebar: expanded ────────────────────────────────────────────────
  const navExpanded = (
    <div className="flex flex-col items-center gap-4 px-3 py-4 overflow-y-auto shrink-0 relative"
      style={{ width:220, borderRight:"1px solid rgba(200,220,255,0.4)" }}>
      {/* Collapse button — pinned top-right */}
      <button onClick={()=>setNavOpen(false)} title="Collapse sidebar"
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors z-10"
        style={{ color:"#94a3b8" }}>
        <ChevronLeft size={13} />
      </button>

      {/* Brand logo */}
      <div className="flex items-center gap-2.5 w-full pl-1 shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background:"linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow:"0 3px 10px rgba(79,142,247,0.35)" }}>
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="text-[14px] font-semibold text-slate-700 tracking-tight">Tecktal Tutor</span>
      </div>

      <VoiceOrb size="md" />


      {/* Quick actions grid */}
      <div className="w-full">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5 px-1">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <GlassCard key={a.href}
              onClick={() => a.href==="/" ? setActivePanel(null) : setActivePanel(a.href)}
              glow="blue"
              className="p-2.5 flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: activePanel===a.href ? a.bg+"cc" : a.bg }}>
                <a.icon size={15} style={{ color:a.color }} />
              </div>
              <span className="text-[9.5px] text-slate-500 text-center leading-tight font-medium">{a.label}</span>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* KB selector */}
      <div className="w-full">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">RAG Provider</p>
        <GlassCard className="px-3 py-2 w-full">
          <p className="text-[10px] text-slate-400 mb-1.5">Knowledge Base</p>
          <select value={selectedKb} onChange={(e)=>setSelectedKb(e.target.value)}
            className="w-full text-[11px] text-slate-600 outline-none cursor-pointer"
            style={{ background:"rgba(255,255,255,0.5)", border:"1px solid rgba(200,220,255,0.5)", borderRadius:8, padding:"5px 8px" }}>
            {MOCK_KBS.map((kb)=><option key={kb} value={kb}>{kb}</option>)}
          </select>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400">{selectedKb===MOCK_KBS[0]?"All sources active":"1 source active"}</span>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="px-3 py-2.5 w-full">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Say <span className="text-blue-500 font-medium">&quot;research&quot;</span> ·{" "}
          <span className="text-blue-500 font-medium">&quot;solver&quot;</span> ·{" "}
          <span className="text-blue-500 font-medium">&quot;go back&quot;</span>
        </p>
      </GlassCard>
    </div>
  );

  // ── Conversation panel content ────────────────────────────────────────────
  const conversationPanel = (
    <>
      {/* Disconnect banner */}
      {!wsConnected && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b"
          style={{ background:"rgba(251,191,36,0.1)", borderColor:"rgba(251,191,36,0.3)" }}>
          <WifiOff size={12} style={{ color:"#d97706" }} />
          <span className="text-[11px] font-medium" style={{ color:"#d97706" }}>Agent disconnected — reconnecting…</span>
        </div>
      )}
      {/* Tool indicator */}
      {activeTool && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b"
          style={{ background:"rgba(79,142,247,0.07)", borderColor:"rgba(79,142,247,0.18)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <Wrench size={11} style={{ color:"#4f8ef7" }} />
          <span className="text-[11px] font-medium text-blue-600 truncate">{toolLabel(activeTool)}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom:"1px solid rgba(200,220,255,0.4)" }}>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Conversation</p>
          {history.length>0 && <p className="text-[11px] text-slate-400 mt-0.5">{history.length} answer{history.length>1?"s":""}</p>}
        </div>
        {history.length>0 && (
          <button onClick={clearHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50/60 transition-colors text-[11px]">
            <Trash2 size={12} />Clear
          </button>
        )}
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {history.length===0 && !isThinking ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(79,142,247,0.08)", border:"1px solid rgba(79,142,247,0.15)" }}>
              <Microscope size={24} style={{ color:"rgba(79,142,247,0.5)" }} />
            </div>
            <p className="text-sm font-medium text-slate-400">Ask anything</p>
            <p className="text-[11px] text-slate-300 max-w-[200px] leading-relaxed">
              Speak or type — the AI will guide you through the app
            </p>
          </div>
        ) : (
          <>
            {history.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 animate-fade-up">
                {/* Only show user bubble if there's a real query */}
                {item.query && item.query!=="…" && (
                  <div className="flex justify-end">
                    <div className="px-3.5 py-2 rounded-2xl rounded-br-sm text-[12.5px] font-medium max-w-[85%]"
                      style={{ background:"linear-gradient(135deg,#4f8ef7,#7c5ef8)", color:"#fff" }}>
                      {item.query}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl rounded-tl-sm px-4 py-3.5"
                  style={{ background:"rgba(255,255,255,0.82)", backdropFilter:"blur(16px)",
                    border:"1px solid rgba(200,220,255,0.5)", boxShadow:"0 4px 20px rgba(100,130,200,0.08)" }}>
                  <div className="prose-response text-[13px] leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath,remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {item.written}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {/* Thinking bubble */}
            {isThinking && (
              <div className="flex flex-col gap-2 animate-fade-up">
                {lastQuery && lastQuery!=="…" && (
                  <div className="flex justify-end">
                    <div className="px-3.5 py-2 rounded-2xl rounded-br-sm text-[12.5px] font-medium max-w-[85%] opacity-70"
                      style={{ background:"linear-gradient(135deg,#4f8ef7,#7c5ef8)", color:"#fff" }}>
                      {lastQuery}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl rounded-tl-sm px-4 py-3.5"
                  style={{ background:"rgba(255,255,255,0.82)", backdropFilter:"blur(16px)", border:"1px solid rgba(200,220,255,0.5)" }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    {[0,1,2].map((i)=>(
                      <span key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-typing-dot"
                        style={{ animationDelay:`${i*0.2}s` }} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">
                      {activeTool ? `Using ${toolLabel(activeTool)}…` : "Thinking…"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[75,90,55].map((w,i)=>(
                      <div key={i} className="h-2.5 rounded-full bg-slate-100 animate-pulse"
                        style={{ width:`${w}%`, animationDelay:`${i*0.1}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
      <InputBar />
    </>
  );

  return (
    <AppShell hideInputBar>
      <div className="flex h-full overflow-hidden">

        {/* ── LEFT: Nav sidebar (collapsible) ─────────────────────────── */}
        {navOpen ? navExpanded : navCollapsed}

        {/* ── CENTER: Conversation panel (always mounted) ──────────────── */}
        <div className="flex flex-col overflow-hidden transition-all duration-300 relative"
          style={{
            width: activePanel ? (chatPanelOpen ? 300 : 52) : undefined,
            flex:  activePanel ? undefined : 1,
            borderRight: activePanel ? "1px solid rgba(200,220,255,0.4)" : undefined,
            minWidth: 0,
          }}>

          {/* Chat collapse/expand toggle (only when page panel open) */}
          {activePanel && (
            <button onClick={()=>setChatPanelOpen(!chatPanelOpen)}
              title={chatPanelOpen?"Collapse chat":"Expand chat"}
              className="absolute top-3 right-2 z-20 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color:"#94a3b8" }}>
              {chatPanelOpen ? <ChevronLeft size={13}/> : <ChevronRight size={13}/>}
            </button>
          )}

          {/* Full conversation when expanded or home */}
          {(!activePanel || chatPanelOpen) && conversationPanel}

          {/* Collapsed chat icon strip */}
          {activePanel && !chatPanelOpen && (
            <div className="flex flex-col items-center pt-12 gap-3">
              <MessageSquare size={14} style={{ color:"#94a3b8" }} />
              {isThinking && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
              {activeTool  && <Wrench size={12} style={{ color:"#4f8ef7" }} />}
              {!wsConnected && <WifiOff size={12} style={{ color:"#d97706" }} />}
            </div>
          )}
        </div>

        {/* ── RIGHT: Page content panel ─────────────────────────────────── */}
        {visibleAction && (
          <div className="flex flex-col overflow-hidden"
            style={{
              flex:          activePanel ? 1 : 0,
              width:         activePanel ? undefined : 0,
              transform:     activePanel ? "translateX(0)"    : "translateX(8px)",
              opacity:       activePanel ? 1                  : 0,
              pointerEvents: activePanel ? "auto"             : "none",
              transition:    "transform 320ms cubic-bezier(0.32,0.72,0,1), opacity 280ms ease, flex 300ms ease, width 300ms ease",
            }}>
            {/* Page header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom:"1px solid rgba(200,220,255,0.4)",
                background:"rgba(255,255,255,0.6)", backdropFilter:"blur(12px)" }}>
              <div style={{ width:28,height:28,borderRadius:8,background:visibleAction.color+"1c",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <visibleAction.icon size={14} style={{ color:visibleAction.color }} />
              </div>
              <span style={{ fontWeight:700,fontSize:14,color:"#0f172a",flex:1 }}>{visibleAction.label}</span>
              <div style={{ width:7,height:7,borderRadius:"50%",background:visibleAction.color }} />
            </div>
            {/* Page content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel && getPanelContent(activePanel)}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
