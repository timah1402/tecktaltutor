"use client";
import { useState, useRef, useEffect } from "react";
import { Microscope, Database, Globe, GraduationCap, Sparkles, Send, Bot, User, Loader2, CheckCircle2, Download, FileText, BarChart3, Clock } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type PlanMode = "quick" | "medium" | "deep" | "auto";
type ResearchStage = "idle" | "planning" | "researching" | "reporting" | "done";

interface ChatMsg { role: "user" | "assistant"; content: string; isOptimizing?: boolean; }

interface ResearchTask {
  id: string; query: string;
  status: "pending" | "running" | "done";
  source: "rag" | "web" | "paper";
}

const MOCK_TASKS: ResearchTask[] = [
  { id: "1", query: "Quantum entanglement fundamentals",           status: "done",    source: "paper" },
  { id: "2", query: "Bell's theorem experimental verification",   status: "done",    source: "web"   },
  { id: "3", query: "Applications in quantum cryptography",       status: "running", source: "web"   },
  { id: "4", query: "Recent advances 2023–2024",                  status: "pending", source: "web"   },
];

const MOCK_REPORT = `## Quantum Entanglement: A Comprehensive Analysis

### Overview
Quantum entanglement is a phenomenon where two or more particles become correlated such that the quantum state of each particle cannot be described independently of the others, even when separated by large distances.

### Key Findings
- **Bell's Theorem** (1964) proved that no local hidden-variable theory can reproduce all predictions of quantum mechanics
- **Aspect's Experiments** (1982) provided the first strong evidence for quantum non-locality
- **Recent Applications** include quantum key distribution (QKD) and quantum teleportation protocols

### Implications
The phenomenon has profound implications for quantum computing, secure communication, and our fundamental understanding of physical reality.`;

export default function ResearchPage() {
  const [planMode, setPlanMode] = useState<PlanMode>("medium");
  const [tools, setTools] = useState({ rag: false, paper: true, web: true });
  const [topicOpt, setTopicOpt] = useState(true);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [stage, setStage] = useState<ResearchStage>("idle");
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [report, setReport] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const toggleTool = (key: keyof typeof tools) => {
    const next = { ...tools, [key]: !tools[key] };
    if (!next.rag && !next.paper && !next.web) return;
    setTools(next);
  };

  const sendChat = async (q?: string) => {
    const msg = q ?? chatInput.trim();
    if (!msg || isChatting) return;
    setChatInput("");
    setChatMsgs(prev => [...prev, { role: "user", content: msg }]);
    setIsChatting(true);
    if (topicOpt) setChatMsgs(prev => [...prev, { role: "assistant", content: "", isOptimizing: true }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `You are a research topic assistant. Help optimize and expand this research topic: ${msg}` }) });
      const data = await res.json();
      setChatMsgs(prev => {
        const copy = [...prev];
        const lastIdx = copy.findLastIndex((m: ChatMsg) => m.isOptimizing);
        if (lastIdx >= 0) copy[lastIdx] = { role: "assistant", content: data.answer ?? "" };
        else copy.push({ role: "assistant", content: data.answer ?? "" });
        return copy;
      });
      setResearchTopic(msg);
    } catch {
      setChatMsgs(prev => prev.filter((m: ChatMsg) => !m.isOptimizing).concat({ role: "assistant", content: "Sorry, something went wrong." }));
    }
    setIsChatting(false);
  };

  const startResearch = async () => {
    if (!researchTopic) return;
    setStage("planning"); setTasks([]);
    await new Promise(r => setTimeout(r, 1200));
    setStage("researching"); setTasks(MOCK_TASKS);
    await new Promise(r => setTimeout(r, 2000));
    setStage("reporting"); setReport("");
    await new Promise(r => setTimeout(r, 1500));
    setStage("done"); setReport(MOCK_REPORT);
  };

  const sourceIcon = { rag: Database, web: Globe, paper: GraduationCap };
  const sourceColor = { rag: "text-blue-500", web: "text-emerald-500", paper: "text-indigo-500" };

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Microscope className="w-7 h-7 text-emerald-600" />
            Deep Research
          </h1>
          <p className="text-slate-500 text-sm mt-1">Comprehensive AI research synthesis</p>
        </div>

        {/* Config */}
        <GlassCard className="p-4 space-y-4">
          {/* Plan mode */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Plan Mode</p>
            <div className="flex p-1 rounded-xl gap-1" style={{ background: "rgba(255,255,255,0.5)" }}>
              {(["quick", "medium", "deep", "auto"] as PlanMode[]).map(m => (
                <button key={m} onClick={() => setPlanMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${planMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Research Tools</p>
            <div className="flex gap-3">
              {(Object.entries(tools) as [keyof typeof tools, boolean][]).map(([key, val]) => {
                const Icon = sourceIcon[key];
                return (
                  <button key={key} onClick={() => toggleTool(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${val ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200"}`}>
                    <Icon className={`w-3.5 h-3.5 ${val ? "text-emerald-600" : "text-slate-400"}`} />
                    {key.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic optimization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Topic Optimization
            </div>
            <button onClick={() => setTopicOpt(p => !p)}
              className={`w-11 h-6 rounded-full transition-all relative ${topicOpt ? "bg-emerald-500" : "bg-slate-200"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${topicOpt ? "right-1" : "left-1"}`} />
            </button>
          </div>
        </GlassCard>

        {/* Topic assistant */}
        <GlassCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-white/60 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">Topic Assistant</span>
            {stage !== "idle" && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Running</span>}
          </div>
          <div className="max-h-52 overflow-y-auto p-3 space-y-2">
            {chatMsgs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Describe your research topic to get started…</p>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "bg-indigo-100 text-indigo-800" : "bg-white/80 text-slate-700 border border-slate-100"}`}>
                  {m.isOptimizing ? <span className="flex items-center gap-1.5 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" />Optimizing topic…</span> : m.content}
                </div>
                {m.role === "user" && <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/60">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()} disabled={stage !== "idle" && stage !== "done"}
              placeholder="Enter research topic…"
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 disabled:opacity-50" />
            <button onClick={() => sendChat()} disabled={!chatInput.trim() || isChatting}
              className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </GlassCard>

        {/* Start research button */}
        {researchTopic && stage === "idle" && (
          <button onClick={startResearch}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <Microscope className="w-4 h-4" />Start Research
          </button>
        )}

        {/* Research dashboard */}
        {stage !== "idle" && (
          <div className="space-y-3">
            {/* Status */}
            <GlassCard className="px-4 py-3 flex items-center gap-3">
              {stage !== "done" ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              <span className="text-sm font-medium text-slate-700">
                {stage === "planning" ? "Planning research queries…" : stage === "researching" ? "Executing research tasks…" : stage === "reporting" ? "Compiling report…" : "Research complete!"}
              </span>
              {stage === "done" && (
                <div className="flex gap-2 ml-auto">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    <FileText className="w-3.5 h-3.5" />MD
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    <Download className="w-3.5 h-3.5" />PDF
                  </button>
                </div>
              )}
            </GlassCard>

            {/* Task list */}
            {tasks.length > 0 && (
              <GlassCard className="overflow-hidden">
                <div className="px-4 py-3 border-b border-white/60 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">Research Tasks</span>
                  <span className="text-xs text-slate-400 ml-auto">{tasks.filter(t => t.status === "done").length}/{tasks.length} done</span>
                </div>
                <div className="divide-y divide-white/60">
                  {tasks.map(task => {
                    const SrcIcon = sourceIcon[task.source];
                    return (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                        {task.status === "done"    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> :
                         task.status === "running" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" /> :
                         <Clock className="w-4 h-4 text-slate-300 shrink-0" />}
                        <span className="flex-1 text-xs text-slate-600 truncate">{task.query}</span>
                        <SrcIcon className={`w-3.5 h-3.5 shrink-0 ${sourceColor[task.source]}`} />
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Report */}
            {report && (
              <GlassCard className="p-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Research Report</p>
                <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">{report}</pre>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
