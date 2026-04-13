"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send, Loader2, Bot, User, CheckCircle2, Activity,
  Cpu, DollarSign, Terminal, Search, Sparkles, FileText,
  Trash2, Book, ChevronRight, ChevronLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentName = "InvestigateAgent" | "NoteAgent" | "SolveAgent" | "ToolAgent" | "ResponseAgent";
type AgentStatus = "idle" | "running" | "done" | "error";
type LogType = "system" | "progress" | "tool" | "error" | "step";
type Stage = "investigate" | "solve" | "response" | null;

interface Message { role: "user" | "assistant"; content: string; }
interface LogEntry { type: LogType; content: string; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  "Calculate the linear convolution of $x=[1,2,3]$ and $h=[4,5]$",
  "Solve the differential equation $\\frac{dy}{dx} = x^2 + y$",
  "Prove that $\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$ by induction",
];

const MOCK_LOGS: LogEntry[] = [
  { type: "system",   content: "Initializing connection..." },
  { type: "progress", content: "▶ [Stage: investigate] InvestigateAgent | Analyzing problem statement" },
  { type: "tool",     content: "🔧 [Tool Call] Tool: rag_search — 'integration by parts calculus'" },
  { type: "step",     content: "--- Step 1: Identify integration technique ---" },
  { type: "progress", content: "✔ [Stage: investigate] InvestigateAgent | Search complete (3 results)" },
  { type: "progress", content: "▶ [Stage: solve] SolveAgent | Building solution plan" },
  { type: "step",     content: "--- Step 2: Apply integration by parts ---" },
  { type: "tool",     content: "🔧 [Tool Call] Tool: verify_computation — '∫x·eˣ dx'" },
  { type: "progress", content: "✔ [Stage: solve] SolveAgent | Solution verified" },
  { type: "progress", content: "▶ [Stage: response] ResponseAgent | Composing final answer" },
  { type: "progress", content: "✔ [Stage: response] ResponseAgent | Done" },
];

const MOCK_ANSWER = `To solve $\\int x e^x \\, dx$, we use **integration by parts**.

**Formula:** $\\int u \\, dv = uv - \\int v \\, du$

**Step 1 — Choose $u$ and $dv$:**
$$u = x \\quad \\Rightarrow \\quad du = dx$$
$$dv = e^x \\, dx \\quad \\Rightarrow \\quad v = e^x$$

**Step 2 — Apply the formula:**
$$\\int x e^x \\, dx = x e^x - \\int e^x \\, dx$$

**Step 3 — Integrate the remaining term:**
$$= x e^x - e^x + C$$

**Result:**
$$\\boxed{e^x(x - 1) + C}$$`;

const MOCK_KB = ["Physics Notes", "Math Formulas", "History Essays"];

const AGENT_NAMES: AgentName[] = [
  "InvestigateAgent", "NoteAgent", "SolveAgent", "ToolAgent", "ResponseAgent",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logTypeStyle(type: LogType) {
  switch (type) {
    case "progress": return "border-l-2 border-indigo-400 bg-indigo-50/60 text-indigo-700";
    case "tool":     return "border-l-2 border-emerald-400 bg-emerald-50/60 text-emerald-700";
    case "error":    return "border-l-2 border-red-400 bg-red-50/60 text-red-700";
    case "step":     return "border-l-2 border-blue-300 bg-blue-50/60 text-blue-700 font-medium";
    default:         return "border-l-2 border-slate-300 bg-slate-50/60 text-slate-500";
  }
}

function agentStatusColor(status: AgentStatus) {
  switch (status) {
    case "running": return "bg-indigo-500 text-white animate-pulse";
    case "done":    return "bg-emerald-500 text-white";
    case "error":   return "bg-red-500 text-white";
    default:        return "bg-slate-200 text-slate-400";
  }
}

function stageLabel(stage: Stage) {
  if (stage === "investigate") return { icon: <Search className="w-3.5 h-3.5" />, label: "Investigating", color: "text-blue-600 bg-blue-50" };
  if (stage === "solve")       return { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Solving", color: "text-amber-600 bg-amber-50" };
  if (stage === "response")    return { icon: <FileText className="w-3.5 h-3.5" />, label: "Responding", color: "text-emerald-600 bg-emerald-50" };
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SolverPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [isSolving, setIsSolving]       = useState(false);
  const [stage, setStage]               = useState<Stage>(null);
  const [logs, setLogs]                 = useState<LogEntry[]>([]);
  const [agentStatus, setAgentStatus]   = useState<Record<AgentName, AgentStatus>>(
    Object.fromEntries(AGENT_NAMES.map(n => [n, "idle"])) as Record<AgentName, AgentStatus>
  );
  const [tokenStats, setTokenStats]     = useState({ calls: 0, tokens: 0, cost: 0 });
  const [selectedKb, setSelectedKb]     = useState(MOCK_KB[0]);
  const [logPanelOpen, setLogPanelOpen] = useState(true);

  const chatEndRef    = useRef<HTMLDivElement>(null);
  const logEndRef     = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSolving]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const resetAgents = () =>
    setAgentStatus(Object.fromEntries(AGENT_NAMES.map(n => [n, "idle"])) as Record<AgentName, AgentStatus>);

  const handleSend = async (q?: string) => {
    const question = q ?? input.trim();
    if (!question || isSolving) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setIsSolving(true);
    setLogs([]);
    resetAgents();
    setTokenStats({ calls: 0, tokens: 0, cost: 0 });

    // Simulate log stream
    const delays = [200, 500, 900, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 3900];
    MOCK_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);

        // Update stage
        if (log.content.includes("[Stage: investigate]")) setStage("investigate");
        if (log.content.includes("[Stage: solve]"))       setStage("solve");
        if (log.content.includes("[Stage: response]"))    setStage("response");

        // Update agent status
        if (log.content.includes("InvestigateAgent")) {
          const s: AgentStatus = log.content.includes("✔") ? "done" : "running";
          setAgentStatus(prev => ({ ...prev, InvestigateAgent: s }));
        }
        if (log.content.includes("SolveAgent")) {
          const s: AgentStatus = log.content.includes("✔") ? "done" : "running";
          setAgentStatus(prev => ({ ...prev, SolveAgent: s }));
        }
        if (log.content.includes("ResponseAgent")) {
          const s: AgentStatus = log.content.includes("✔") ? "done" : "running";
          setAgentStatus(prev => ({ ...prev, ResponseAgent: s }));
        }
        if (log.content.includes("Tool Call")) {
          setAgentStatus(prev => ({ ...prev, ToolAgent: "running" }));
          setTimeout(() => setAgentStatus(prev => ({ ...prev, ToolAgent: "done" })), 600);
        }

        // Mock token stats update
        setTokenStats({ calls: i + 1, tokens: (i + 1) * 180, cost: (i + 1) * 0.00018 });
      }, delays[i] ?? i * 350);
    });

    // Final answer
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: MOCK_ANSWER }]);
      setIsSolving(false);
      setStage(null);
      setAgentStatus(prev => ({ ...prev, NoteAgent: "done" }));
    }, 4200);
  };

  const handleNew = () => {
    setMessages([]);
    setLogs([]);
    setIsSolving(false);
    setStage(null);
    resetAgents();
    setTokenStats({ calls: 0, tokens: 0, cost: 0 });
  };

  const sl = stageLabel(stage);

  const _inner = (
      <div className="flex h-full overflow-hidden animate-fade-up">

        {/* ── Left: Chat Panel ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-white/20">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/20"
            style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-2.5">
              {isSolving && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
              <span className="font-bold text-slate-800 text-base">Smart Solver</span>
              {sl && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${sl.color}`}>
                  {sl.icon}{sl.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select value={selectedKb} onChange={e => setSelectedKb(e.target.value)}
                className="text-xs bg-white/70 border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-slate-600">
                {MOCK_KB.map(kb => <option key={kb}>{kb}</option>)}
              </select>
              {messages.length > 0 && (
                <button onClick={handleNew}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5"/>New
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
            {messages.length === 0 && !isSolving ? (
              <div className="h-full flex flex-col items-center justify-center gap-6 max-w-md mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">How can I help you today?</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    I can solve complex STEM problems using multi-step reasoning.<br/>
                    Try calculus, physics, proofs, or coding algorithms.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 w-full">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => handleSend(q)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-left text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 transition-all"
                      style={{ background: "rgba(255,255,255,0.65)" }}>
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}
                        components={{ p: ({children}) => <span>{children}</span> }}>
                        {q}
                      </ReactMarkdown>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="flex gap-3">
                  {msg.role === "user" ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-slate-700 leading-relaxed"
                        style={{ background: "rgba(241,245,249,0.85)" }}>
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md"
                        style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="px-5 py-4 rounded-2xl rounded-tl-none border border-slate-200/80 shadow-sm"
                          style={{ background: "rgba(255,255,255,0.85)" }}>
                          <div className="prose-response">
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px] text-slate-400">Verified by DeepTutor Logic Engine</span>
                          <button className="ml-auto flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors">
                            <Book className="w-3 h-3"/>Add to Notebook
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Thinking bubble */}
            {isSolving && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="flex-1 px-4 py-3.5 rounded-2xl rounded-tl-none border border-slate-200/80"
                  style={{ background: "rgba(255,255,255,0.75)" }}>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"/>
                    </span>
                    <span className="font-medium">
                      {stage === "investigate" && "🔍 Investigating…"}
                      {stage === "solve"       && "🧮 Solving…"}
                      {stage === "response"    && "✍️ Composing answer…"}
                      {!stage                  && "Reasoning engine active…"}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-2 w-48 rounded-full bg-slate-100 animate-pulse"/>
                    <div className="h-2 w-32 rounded-full bg-slate-100 animate-pulse"/>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-white/20"
            style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.8)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isSolving}
                placeholder="Ask a difficult question…"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"/>
              <button onClick={() => handleSend()} disabled={!input.trim() || isSolving}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                <Send className="w-4 h-4 text-white"/>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              DeepTutor can make mistakes. Verify important results.
            </p>
          </div>
        </div>

        {/* ── Right: Logic Stream Panel ──────────────────────────────────── */}
        <div className={`flex flex-col shrink-0 overflow-hidden transition-all duration-300 ${logPanelOpen ? "w-[340px]" : "w-10"}`}
          style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>

          {logPanelOpen ? (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-700">
                  <Activity className="w-4 h-4 text-indigo-500"/>Logic Stream
                </div>
                <div className="flex items-center gap-2">
                  {isSolving && (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"/>Running
                    </span>
                  )}
                  <button onClick={() => setLogPanelOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Token stats */}
              {tokenStats.calls > 0 && (
                <div className="px-3 py-2 border-b border-white/20 shrink-0"
                  style={{ background: "rgba(248,250,252,0.6)" }}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-slate-400"/>claude-sonnet</span>
                    <span className="text-slate-300">|</span>
                    <span>{tokenStats.calls} calls</span>
                    <span className="text-slate-300">|</span>
                    <span>{tokenStats.tokens.toLocaleString()} tokens</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <DollarSign className="w-3 h-3"/>{tokenStats.cost.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Agent status grid */}
              <div className="px-3 py-2.5 border-b border-white/20 shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Agents</p>
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_NAMES.map(name => (
                    <span key={name}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${agentStatusColor(agentStatus[name])}`}>
                      {name.replace("Agent", "")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity log */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/20 shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Terminal className="w-3.5 h-3.5 text-slate-400"/>Activity Log
                </span>
                <span className="text-[10px] text-slate-400">{logs.length} entries</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-12">
                    <Activity className="w-8 h-8 opacity-20"/>
                    <p className="text-xs">Waiting for logic execution…</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed ${logTypeStyle(log.type)}`}>
                      {log.content}
                    </div>
                  ))
                )}
                <div ref={logEndRef}/>
              </div>
            </>
          ) : (
            /* Collapsed state */
            <div className="flex flex-col items-center pt-3 gap-2">
              <button onClick={() => setLogPanelOpen(true)}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <Activity className="w-4 h-4 text-indigo-400"/>
              {isSolving && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"/>}
            </div>
          )}
        </div>
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
