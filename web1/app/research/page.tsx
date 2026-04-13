"use client";
import { useState, useRef, useEffect } from "react";
import {
  Microscope, Database, Globe, GraduationCap, Sparkles, Send,
  Bot, User, Loader2, CheckCircle2, Download, FileText,
  BarChart3, Clock, Play, Settings, ChevronLeft, ChevronRight,
  BookOpen, Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanMode    = "quick" | "medium" | "deep" | "auto";
type ToolKey     = "RAG" | "Paper" | "Web";
type Stage       = "idle" | "planning" | "researching" | "reporting" | "done";
type TaskStatus  = "pending" | "running" | "done";
type TaskSource  = "rag" | "web" | "paper";

interface ChatMsg   { id: string; role: "user" | "assistant"; content: string; isOptimizing?: boolean; proposal?: string; }
interface ResearchTask { id: string; query: string; status: TaskStatus; source: TaskSource; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_KBS   = ["Physics Notes", "Math Formulas", "History Essays"];

const MOCK_TASKS: ResearchTask[] = [
  { id: "1", query: "Quantum entanglement fundamentals and Bell's theorem",  status: "done",    source: "paper" },
  { id: "2", query: "Bell inequality experimental violations (1972–2022)",   status: "done",    source: "paper" },
  { id: "3", query: "EPR paradox and non-locality implications",             status: "done",    source: "rag"   },
  { id: "4", query: "Quantum cryptography and QKD protocols",                status: "running", source: "web"   },
  { id: "5", query: "Quantum teleportation: state-of-the-art 2024",         status: "pending", source: "web"   },
  { id: "6", query: "Decoherence and entanglement preservation challenges",  status: "pending", source: "paper" },
];

const PLAN_STEPS = [
  "Parsing research topic…",
  "Decomposing into sub-queries…",
  "Selecting optimal tools…",
  "Building research plan…",
];

const MOCK_REPORT = `# Quantum Entanglement: A Comprehensive Research Report

## Executive Summary

Quantum entanglement is one of the most profound phenomena in quantum mechanics, describing correlations between particles that cannot be explained by classical physics. This report synthesizes current theoretical foundations, experimental evidence, and emerging applications.

---

## 1. Theoretical Foundations

### 1.1 Mathematical Formulation

For a two-qubit system, the entangled Bell states are defined as:

$$|\\Phi^\\pm\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle \\pm |11\\rangle)$$
$$|\\Psi^\\pm\\rangle = \\frac{1}{\\sqrt{2}}(|01\\rangle \\pm |10\\rangle)$$

These states cannot be written as a product $|\\psi_A\\rangle \\otimes |\\psi_B\\rangle$ — the defining characteristic of entanglement.

### 1.2 Bell's Theorem

Bell (1964) proved that **no local hidden-variable theory** can reproduce all quantum mechanical predictions. The CHSH inequality provides a testable bound:

$$\\mathcal{S} = |E(a,b) - E(a,b') + E(a',b) + E(a',b')| \\leq 2$$

Quantum mechanics predicts $\\mathcal{S} \\leq 2\\sqrt{2} \\approx 2.828$, which has been repeatedly confirmed experimentally.

---

## 2. Experimental Evidence

| Experiment | Year | Loophole Closed | $\\mathcal{S}$ Measured |
|---|---|---|---|
| Freedman & Clauser | 1972 | None | 2.29 ± 0.05 |
| Aspect et al. | 1982 | Locality | 2.697 ± 0.015 |
| Weihs et al. | 1998 | Locality (strict) | 2.73 ± 0.02 |
| Hensen et al. (Delft) | 2015 | Both major | 2.42 ± 0.20 |
| NIST (Big Bell Test) | 2018 | Both + freedom-of-choice | 2.587 ± 0.008 |

The 2022 Nobel Prize in Physics was awarded to **Aspect, Clauser, and Zeilinger** for their foundational work on entanglement experiments.

---

## 3. Applications

### 3.1 Quantum Key Distribution (QKD)

The BB84 protocol exploits the no-cloning theorem. The security proof relies on the mutual information bound:

$$I(A:E) \\leq h\\left(\\frac{1+\\sqrt{(2e-1)^2 + (2e_p)^2}}{2}\\right)$$

where $e$ is the quantum bit error rate and $e_p$ is the phase error rate.

### 3.2 Quantum Teleportation

Teleportation transfers a quantum state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ using an entangled pair and classical communication. Fidelity for photonic teleportation has reached **$F > 0.90$** in recent experiments.

---

## 4. Key Challenges

### 4.1 Decoherence

The main obstacle to practical entanglement is **decoherence** — loss of quantum coherence due to environmental interaction. The coherence time for leading platforms:

| Platform | Coherence Time |
|---|---|
| Superconducting qubits | ~100 µs |
| Trapped ions | ~1 s |
| Photons (fiber) | ~1 ms (distance-limited) |
| NV centers (diamond) | ~1 ms at room temperature |

### 4.2 Distribution Distance

Photon loss in optical fiber scales as $10^{-\\alpha L / 10}$, where $\\alpha \\approx 0.2$ dB/km. **Quantum repeaters** using entanglement swapping are needed to overcome this limit:

$$P_{\\text{success}}^{(n)} \\sim \\left(\\frac{L_0}{L}\\right)^n$$

---

## 5. Conclusions

Quantum entanglement has transitioned from a philosophical curiosity to a practical resource for quantum information technologies. Ongoing advances in quantum error correction, photonic integration, and satellite-based QKD (e.g., **Micius satellite**) are rapidly expanding the feasibility of large-scale quantum networks.

> "God does not play dice with the universe." — Einstein
> "Einstein was wrong." — Bell test experiments, 1972–2022

---

*Report generated by DeepTutor Research Engine · 1,847 words · 6 sources*`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<ToolKey, typeof Database> = {
  RAG:   Database,
  Paper: GraduationCap,
  Web:   Globe,
};

const SOURCE_ICON: Record<TaskSource, typeof Database> = {
  rag:   Database,
  paper: GraduationCap,
  web:   Globe,
};

const SOURCE_COLOR: Record<TaskSource, string> = {
  rag:   "text-blue-500",
  paper: "text-indigo-500",
  web:   "text-emerald-500",
};

const STAGE_LABEL: Record<Stage, string> = {
  idle:       "Idle",
  planning:   "Planning…",
  researching:"Researching…",
  reporting:  "Compiling report…",
  done:       "Completed",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResearchPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [planMode,    setPlanMode]    = useState<PlanMode>("medium");
  const [tools,       setTools]       = useState<Set<ToolKey>>(new Set(["RAG", "Paper"]));
  const [topicOpt,    setTopicOpt]    = useState(true);
  const [selectedKb,  setSelectedKb]  = useState(MOCK_KBS[0]);
  const [chatMsgs,    setChatMsgs]    = useState<ChatMsg[]>([{
    id: "welcome", role: "assistant",
    content: "Welcome to Deep Research Lab.\n\nConfigure settings, then enter a research topic below to get started.",
  }]);
  const [chatInput,   setChatInput]   = useState("");
  const [isOptimizing,setIsOptimizing]= useState(false);
  const [stage,       setStage]       = useState<Stage>("idle");
  const [planStep,    setPlanStep]    = useState(0);
  const [tasks,       setTasks]       = useState<ResearchTask[]>([]);
  const [report,      setReport]      = useState("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const reportRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const toggleTool = (key: ToolKey) => {
    setTools(prev => {
      const next = new Set(prev);
      if (next.has(key) && next.size === 1) return prev; // keep at least one
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || isOptimizing || (stage !== "idle" && stage !== "done")) return;
    setChatInput("");
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: msg };
    setChatMsgs(prev => [...prev, userMsg]);

    if (!topicOpt) {
      // Skip optimization — show direct start button
      setChatMsgs(prev => [...prev, {
        id: "direct",
        role: "assistant",
        content: `Topic accepted: **${msg}**\n\nReady to start research.`,
        proposal: msg,
      }]);
      return;
    }

    setIsOptimizing(true);
    setChatMsgs(prev => [...prev, { id: "opt", role: "assistant", content: "", isOptimizing: true }]);
    await new Promise(r => setTimeout(r, 1400));

    const optimized = `${msg} — focusing on recent advances (2020–2024), experimental evidence, and practical applications`;
    setChatMsgs(prev => prev.map(m => m.id === "opt" ? {
      id: "opt-done",
      role: "assistant",
      content: `I've optimized your topic:\n\n**${optimized}**\n\nThis refined scope includes recent experimental results and practical applications for a more comprehensive analysis.`,
      proposal: optimized,
    } : m));
    setIsOptimizing(false);
  };

  const startResearch = async (topic: string) => {
    setStage("planning");
    setTasks([]);
    setReport("");

    // Planning phase
    for (let i = 0; i < PLAN_STEPS.length; i++) {
      setPlanStep(i);
      await new Promise(r => setTimeout(r, 450));
    }

    // Researching phase
    setStage("researching");
    const initial = MOCK_TASKS.map(t => ({ ...t, status: "pending" as TaskStatus }));
    setTasks(initial);

    for (let i = 0; i < MOCK_TASKS.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: "running" } : t));
      await new Promise(r => setTimeout(r, 500));
      setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: "done" } : t));
    }

    // Reporting phase
    setStage("reporting");
    await new Promise(r => setTimeout(r, 1200));

    setStage("done");
    setReport(MOCK_REPORT);
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const exportMd = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "research-report.md"; a.click();
  };

  const doneCount = tasks.filter(t => t.status === "done").length;

  const _inner = (
      <div className="flex h-full overflow-hidden animate-fade-up">

        {/* ── Left Panel: Config + Chat ───────────────────────────────────── */}
        <div
          className="flex flex-col shrink-0 overflow-hidden transition-all duration-300 border-r border-white/20"
          style={{
            width: leftCollapsed ? "40px" : "320px",
            background: "rgba(255,255,255,0.38)",
            backdropFilter: "blur(10px)",
          }}
        >
          {leftCollapsed ? (
            <div className="flex flex-col items-center pt-3 gap-2">
              <button onClick={() => setLeftCollapsed(false)}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-400">
                <ChevronRight className="w-4 h-4"/>
              </button>
              <Microscope className="w-4 h-4 text-emerald-500"/>
              {stage !== "idle" && stage !== "done" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500"/>Configuration
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${stage !== "idle" && stage !== "done" ? "bg-emerald-500 animate-pulse" : stage === "done" ? "bg-emerald-500" : "bg-slate-300"}`}/>
                    <span className={stage === "done" ? "text-emerald-600 font-medium" : "text-slate-400"}>
                      {STAGE_LABEL[stage]}
                    </span>
                  </div>
                  <button onClick={() => setLeftCollapsed(true)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Config */}
              <div className="px-4 py-3 border-b border-white/20 shrink-0 space-y-3">
                {/* KB selector */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Knowledge Base
                  </p>
                  <select value={selectedKb} onChange={e => setSelectedKb(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-700 outline-none border border-slate-200/80 focus:border-emerald-400 transition-colors"
                    style={{ background: "rgba(255,255,255,0.7)" }}>
                    {MOCK_KBS.map(kb => <option key={kb}>{kb}</option>)}
                  </select>
                </div>

                {/* Plan mode */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Plan Mode
                  </p>
                  <div className="flex p-0.5 rounded-lg gap-0.5"
                    style={{ background: "rgba(255,255,255,0.5)" }}>
                    {(["quick","medium","deep","auto"] as PlanMode[]).map(m => (
                      <button key={m} onClick={() => setPlanMode(m)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all ${planMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Research Tools
                  </p>
                  <div className="flex gap-1.5">
                    {(["RAG","Paper","Web"] as ToolKey[]).map(key => {
                      const Icon = TOOL_ICONS[key];
                      const on   = tools.has(key);
                      return (
                        <button key={key} onClick={() => toggleTool(key)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                            on ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50/80 text-slate-400 border-slate-200/60 hover:bg-slate-100"
                          }`}>
                          <Icon className={`w-3 h-3 ${on ? "text-emerald-600" : "text-slate-400"}`}/>
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topic optimization toggle */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200/60"
                  style={{ background: "rgba(255,255,255,0.55)" }}>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Sparkles className={`w-3.5 h-3.5 ${topicOpt ? "text-indigo-500" : "text-slate-400"}`}/>
                    Topic Optimization
                  </span>
                  <button onClick={() => setTopicOpt(p => !p)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${topicOpt ? "bg-indigo-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${topicOpt ? "right-0.5" : "left-0.5"}`}/>
                  </button>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/20 shrink-0 flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-indigo-500"/>
                  <span className="text-xs font-semibold text-slate-600">Topic Assistant</span>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                  {chatMsgs.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1.5`}>
                      <div className={`max-w-[90%] px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-100 text-indigo-900 rounded-tr-none"
                          : "border border-slate-200/80 text-slate-700 rounded-tl-none"
                      }`} style={msg.role === "assistant" ? { background: "rgba(255,255,255,0.82)" } : {}}>
                        {msg.isOptimizing ? (
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Loader2 className="w-3 h-3 animate-spin"/>Optimizing topic…
                          </span>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                      {/* Start Research button */}
                      {msg.proposal && stage === "idle" && (
                        <button onClick={() => startResearch(msg.proposal!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white shadow-md transition-all active:scale-[0.97]"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 10px rgba(16,185,129,0.3)" }}>
                          <Play className="w-3 h-3"/>Start Research
                        </button>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef}/>
                </div>

                <div className="px-3 py-2.5 border-t border-white/20 shrink-0 flex items-center gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    disabled={isOptimizing || (stage !== "idle" && stage !== "done")}
                    placeholder={stage !== "idle" && stage !== "done" ? "Research in progress…" : "Enter research topic…"}
                    className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400 disabled:opacity-40"/>
                  <button onClick={sendChat} disabled={!chatInput.trim() || isOptimizing || (stage !== "idle" && stage !== "done")}
                    className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-40 shrink-0"
                    style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                    {isOptimizing ? <Loader2 className="w-3 h-3 text-white animate-spin"/> : <Send className="w-3 h-3 text-white"/>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel: Research Dashboard ────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Dashboard header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/20"
            style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-3">
              {leftCollapsed && (
                <button onClick={() => setLeftCollapsed(false)}
                  className="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-slate-500">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.12)" }}>
                <Microscope className="w-5 h-5 text-emerald-600"/>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Deep Research</p>
                <p className="text-[11px] text-slate-500">
                  {stage === "idle"       && "Configure and start a research session"}
                  {stage === "planning"   && PLAN_STEPS[planStep]}
                  {stage === "researching"&& `${doneCount} / ${MOCK_TASKS.length} tasks complete`}
                  {stage === "reporting"  && "Compiling comprehensive report…"}
                  {stage === "done"       && `Report ready · ${MOCK_TASKS.length} sources analyzed`}
                </p>
              </div>
            </div>

            {/* Export buttons */}
            {stage === "done" && (
              <div className="flex items-center gap-2">
                <button onClick={exportMd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-white/60 transition-colors"
                  style={{ background: "rgba(255,255,255,0.7)" }}>
                  <FileText className="w-3.5 h-3.5"/>MD
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  <Download className="w-3.5 h-3.5"/>PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                  style={{ background: "rgba(238,242,255,0.7)" }}>
                  <BookOpen className="w-3.5 h-3.5"/>Save
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── Idle state ── */}
            {stage === "idle" && (
              <div className="h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(8px)" }}>
                  <Microscope className="w-12 h-12 text-slate-300"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-700">Deep Research Lab</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                    Enter a research topic in the chat on the left. The AI will optimize your query,
                    search across RAG, academic papers, and the web, then compile a comprehensive
                    report with citations and LaTeX-rendered formulas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Quantum Computing", "Climate Science", "Neural Networks", "Genomics"].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 border border-emerald-200"
                      style={{ background: "rgba(209,250,229,0.5)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Planning state ── */}
            {stage === "planning" && (
              <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.12)" }}>
                  <Activity className="w-8 h-8 text-emerald-500 animate-pulse"/>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Planning Research</p>
                  <p className="text-sm text-slate-400 mt-1">{PLAN_STEPS[planStep]}</p>
                </div>
                <div className="w-48 space-y-2">
                  {PLAN_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${i <= planStep ? "text-emerald-600" : "text-slate-300"}`}>
                      {i < planStep
                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/>
                        : i === planStep
                        ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin"/>
                        : <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0"/>}
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Researching state ── */}
            {(stage === "researching" || (stage === "reporting" && tasks.length > 0)) && (
              <div className="px-5 py-5 space-y-4">
                {/* Progress bar */}
                <div className="rounded-2xl border border-white/60 px-5 py-4 space-y-2.5"
                  style={{ background: "rgba(255,255,255,0.7)" }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-2">
                      {stage === "reporting"
                        ? <><Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin"/>Compiling report…</>
                        : <><BarChart3 className="w-3.5 h-3.5 text-emerald-500"/>Researching</>}
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {Math.round((doneCount / MOCK_TASKS.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(doneCount / MOCK_TASKS.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#059669)" }}/>
                  </div>
                  <div className="text-[10px] text-slate-400">{doneCount} of {MOCK_TASKS.length} queries complete</div>
                </div>

                {/* Task list */}
                <div className="rounded-2xl border border-white/60 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.7)" }}>
                  <div className="px-4 py-2.5 border-b border-slate-100/80 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500"/>
                    <span className="text-xs font-semibold text-slate-700">Research Tasks</span>
                    <span className="ml-auto text-[10px] text-slate-400">{doneCount}/{tasks.length} done</span>
                  </div>
                  <div className="divide-y divide-slate-100/70">
                    {tasks.map(task => {
                      const SrcIcon = SOURCE_ICON[task.source];
                      return (
                        <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                          {task.status === "done"
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>
                            : task.status === "running"
                            ? <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0"/>
                            : <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0"/>}
                          <span className={`flex-1 text-xs truncate ${task.status === "pending" ? "text-slate-400" : "text-slate-600"}`}>
                            {task.query}
                          </span>
                          <SrcIcon className={`w-3.5 h-3.5 shrink-0 ${SOURCE_COLOR[task.source]}`}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Done: Report ── */}
            {stage === "done" && report && (
              <div ref={reportRef} className="px-8 py-6 max-w-4xl mx-auto">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Sources",   value: MOCK_TASKS.length,  color: "text-blue-600"    },
                    { label: "Words",     value: "1,847",            color: "text-emerald-600" },
                    { label: "Sections",  value: "5",                color: "text-indigo-600"  },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4 border border-slate-200/80 text-center"
                      style={{ background: "rgba(255,255,255,0.78)" }}>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Report */}
                <div className="rounded-2xl border border-slate-200/80 px-8 py-7 shadow-sm"
                  style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)" }}>
                  <div className="prose-response">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {report}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="h-8"/>
              </div>
            )}
          </div>
        </div>
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
