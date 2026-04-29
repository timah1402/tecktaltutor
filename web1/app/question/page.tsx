"use client";
import { useState } from "react";
import {
  PenTool, Sparkles, Upload, Check, X, BookOpen,
  BrainCircuit, FileText, RefreshCw, ChevronLeft,
  ChevronRight, CheckCircle2, Loader2, Database,
  AlertCircle, Trophy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";
import { usePageAction } from "../providers/NavigationProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode       = "knowledge" | "mimic";
type Difficulty = "Easy" | "Medium" | "Hard";
type QType      = "MCQ" | "Written" | "Mixed";
type Step       = "config" | "generating" | "result";

interface Question {
  id: number;
  text: string;
  type: "mcq" | "written";
  options?: string[];
  answer?: number;
  explanation?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1, type: "mcq", text: "What is the derivative of $\\sin(x)$?",
    options: ["$\\cos(x)$", "$-\\cos(x)$", "$\\tan(x)$", "$-\\sin(x)$"], answer: 0,
    explanation: "The derivative of $\\sin(x)$ is $\\cos(x)$ by the standard differentiation rule.",
  },
  {
    id: 2, type: "mcq", text: "Which rule applies when differentiating a product $f(x) \\cdot g(x)$?",
    options: ["Chain Rule", "Product Rule", "Quotient Rule", "Power Rule"], answer: 1,
    explanation: "The **Product Rule** states: $(fg)' = f'g + fg'$.",
  },
  {
    id: 3, type: "written", text: "Explain the relationship between integration by parts and the product rule.",
    explanation: "Integration by parts comes directly from integrating both sides of the product rule: $\\int u \\, dv = uv - \\int v \\, du$.",
  },
  {
    id: 4, type: "mcq", text: "Evaluate $\\int e^x \\, dx$:",
    options: ["$e^x + C$", "$xe^x + C$", "$\\frac{e^x}{x} + C$", "$e^{2x} + C$"], answer: 0,
    explanation: "$e^x$ is its own antiderivative: $\\int e^x \\, dx = e^x + C$.",
  },
  {
    id: 5, type: "mcq", text: "The chain rule states that if $y = f(g(x))$, then $\\frac{dy}{dx}$ equals:",
    options: ["$f'(x) \\cdot g'(x)$", "$f'(g(x)) \\cdot g'(x)$", "$f(g'(x))$", "$f'(g(x)) + g'(x)$"], answer: 1,
    explanation: "Chain rule: $\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$.",
  },
  {
    id: 6, type: "written", text: "State and explain the two parts of the Fundamental Theorem of Calculus.",
    explanation: "**Part 1:** If $F(x) = \\int_a^x f(t)\\,dt$, then $F'(x) = f(x)$. **Part 2:** $\\int_a^b f(x)\\,dx = F(b) - F(a)$.",
  },
  {
    id: 7, type: "mcq", text: "What is $\\lim_{x \\to 0} \\frac{\\sin x}{x}$?",
    options: ["0", "1", "$\\infty$", "Undefined"], answer: 1,
    explanation: "This is a standard limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.",
  },
];

const MOCK_KBS = ["Physics Notes", "Math Formulas", "History Essays"];

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const QTYPES: QType[]            = ["MCQ", "Written", "Mixed"];
const COUNTS                     = [5, 10, 20];

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy:   "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard:   "text-red-600 bg-red-50 border-red-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuestionPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [mode,       setMode]       = useState<Mode>("knowledge");
  const [topic,      setTopic]      = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [qtype,      setQtype]      = useState<QType>("Mixed");
  const [count,      setCount]      = useState(10);
  const [selectedKb, setSelectedKb] = useState(MOCK_KBS[0]);
  const [step,       setStep]       = useState<Step>("config");
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [answers,    setAnswers]    = useState<Record<number, string | number>>({});
  const [submitted,  setSubmitted]  = useState<Record<number, boolean>>({});
  const [showExp,    setShowExp]    = useState<Record<number, boolean>>({});

  // ── Derived ──────────────────────────────────────────────────────────────
  const current    = questions[activeIdx];
  const mcqQs      = questions.filter(q => q.type === "mcq");
  const mcqDone    = mcqQs.filter(q => submitted[q.id]).length;
  const score      = mcqQs.filter(q => submitted[q.id] && answers[q.id] === q.answer).length;
  const pct        = mcqQs.length ? Math.round((score / mcqQs.length) * 100) : 0;
  const allDone    = questions.length > 0 && questions.every(q => submitted[q.id] || q.type === "written");

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setStep("generating");
    setTimeout(() => {
      const filtered = MOCK_QUESTIONS.filter(q =>
        qtype === "Mixed" ? true : qtype === "MCQ" ? q.type === "mcq" : q.type === "written"
      ).slice(0, count);
      setQuestions(filtered);
      setAnswers({}); setSubmitted({}); setShowExp({}); setActiveIdx(0);
      setStep("result");
    }, 1800);
  };

  // ── Agent-driven generation via SSE page_action ───────────────────────────
  usePageAction("question", (evt) => {
    if (evt.action === "generate" && evt.data.topic) {
      const agentTopic = evt.data.topic as string;
      const diff = evt.data.difficulty as Difficulty | undefined;
      if (diff && ["Easy","Medium","Hard"].includes(diff)) setDifficulty(diff);
      setTopic(agentTopic);
      setMode("knowledge");
      // Delay so topic state is flushed before generate reads it
      setTimeout(handleGenerate, 300);
    }
  });

  const handleReset = () => {
    setStep("config"); setQuestions([]); setAnswers({});
    setSubmitted({}); setShowExp({}); setActiveIdx(0);
  };

  const answerQuestion = (val: number) => {
    if (submitted[current?.id]) return;
    setAnswers(p => ({ ...p, [current.id]: val }));
  };

  const submitAnswer = () => {
    if (!current || submitted[current.id]) return;
    setSubmitted(p => ({ ...p, [current.id]: true }));
    setShowExp(p => ({ ...p, [current.id]: true }));
  };

  const glass = {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(200,220,255,0.5)",
    boxShadow: "0 2px 16px rgba(100,130,200,0.09)",
  } as const;

  // ── Render ────────────────────────────────────────────────────────────────
  const _inner = (
      <div className="flex flex-col h-full">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: "1px solid rgba(200,220,255,0.4)", background: "rgba(248,250,255,0.7)" }}>
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-bold text-slate-800">Question Generator</span>

            {/* Mode toggle */}
            {step === "config" && (
              <div className="flex ml-3 p-0.5 rounded-lg gap-0.5"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                {(["knowledge", "mimic"] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      mode === m ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}>
                    {m === "knowledge" ? <BrainCircuit className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {m === "knowledge" ? "Custom" : "Mimic Exam"}
                  </button>
                ))}
              </div>
            )}

            {/* Status pill */}
            {step === "generating" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-purple-600"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <Loader2 className="w-3 h-3 animate-spin" /> Generating…
              </div>
            )}
            {step === "result" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-600"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <CheckCircle2 className="w-3 h-3" /> {questions.length} questions ready
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* KB selector */}
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <select value={selectedKb} onChange={e => setSelectedKb(e.target.value)}
                className="text-xs text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-purple-300/50"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,220,255,0.6)" }}>
                {MOCK_KBS.map(kb => <option key={kb} value={kb}>{kb}</option>)}
              </select>
            </div>
            {step !== "config" && (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                style={{ border: "1px solid rgba(200,220,255,0.5)" }}>
                <RefreshCw className="w-3 h-3" /> New
              </button>
            )}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="flex-1 flex gap-3 p-3 overflow-hidden">

          {/* ── Left: Config / Score panel ──────────────────── */}
          <div className="flex flex-col gap-3 shrink-0" style={{ width: 260 }}>

            {step === "config" ? (
              /* Config form */
              <div className="flex flex-col gap-3 rounded-2xl p-4" style={glass}>
                {/* Mode banner */}
                <div className={`flex items-start gap-2.5 p-3 rounded-xl ${mode === "knowledge" ? "bg-purple-50 border border-purple-100" : "bg-blue-50 border border-blue-100"}`}>
                  {mode === "knowledge"
                    ? <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    : <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-xs font-bold ${mode === "knowledge" ? "text-purple-800" : "text-blue-800"}`}>
                      {mode === "knowledge" ? "Custom Mode" : "Mimic Exam Mode"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      {mode === "knowledge"
                        ? "Generate questions from your knowledge base content."
                        : "Upload an exam paper and generate similar questions."}
                    </p>
                  </div>
                </div>

                {mode === "knowledge" ? (
                  <>
                    {/* Topic */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Topic / Knowledge Point</p>
                      <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. Calculus derivatives, WWII…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-300/40"
                        style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,220,255,0.6)" }} />
                    </div>

                    {/* Difficulty */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Difficulty</p>
                      <div className="flex gap-1.5">
                        {DIFFICULTIES.map(d => (
                          <button key={d} onClick={() => setDifficulty(d)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${difficulty === d ? DIFF_COLORS[d] : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Question Type</p>
                      <div className="flex gap-1.5">
                        {QTYPES.map(t => (
                          <button key={t} onClick={() => setQtype(t)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${qtype === t ? "text-purple-700 bg-purple-50 border-purple-200" : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Count */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Number of Questions</p>
                      <div className="flex gap-1.5">
                        {COUNTS.map(n => (
                          <button key={n} onClick={() => setCount(n)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${count === n ? "text-purple-700 bg-purple-50 border-purple-200" : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Mimic mode */
                  <div
                    className="flex flex-col items-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
                    style={{ border: "2px dashed rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.03)" }}>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Drop exam PDF here</p>
                    <p className="text-[10px] text-slate-400">or click to browse</p>
                  </div>
                )}

                <button onClick={handleGenerate}
                  disabled={mode === "knowledge" ? !topic.trim() : false}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                  <Sparkles className="w-4 h-4" />
                  Generate {mode === "knowledge" ? `${count} Questions` : "from Paper"}
                </button>
              </div>
            ) : step === "generating" ? (
              /* Generating skeleton */
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl p-6 flex-1" style={glass}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Generating questions…</p>
                  <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
                </div>
                <div className="w-full space-y-2">
                  {[80,60,90,50,70].map((w,i) => (
                    <div key={i} className="h-2 rounded-full bg-slate-100 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              /* Score card */
              <div className="flex flex-col gap-3">
                {/* Score summary */}
                <div className="rounded-2xl p-4 space-y-3" style={glass}>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Score</p>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-bold text-slate-800">{score}</span>
                    <span className="text-lg text-slate-400">/{mcqQs.length}</span>
                    <p className="text-xs text-slate-400 mt-1">{pct}% correct · {mcqQs.length} MCQ</p>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(200,215,240,0.35)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  {allDone && (
                    <div className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold ${
                      pct >= 70 ? "bg-emerald-50 text-emerald-700" : pct >= 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {pct >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {pct >= 70 ? "Excellent work!" : pct >= 40 ? "Good effort!" : "Keep practising!"}
                    </div>
                  )}
                </div>

                {/* Question navigator */}
                <div className="rounded-2xl p-3" style={glass}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Questions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map((q, i) => {
                      const isActive  = i === activeIdx;
                      const isDone    = submitted[q.id];
                      const isCorrect = isDone && q.type === "mcq" && answers[q.id] === q.answer;
                      const isWrong   = isDone && q.type === "mcq" && answers[q.id] !== q.answer;
                      return (
                        <button key={q.id} onClick={() => setActiveIdx(i)}
                          className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: isCorrect ? "#dcfce7" : isWrong ? "#fee2e2" : isDone ? "#f1f5f9" : isActive ? "rgba(139,92,246,0.12)" : "rgba(248,250,255,0.8)",
                            color: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isActive ? "#7c3aed" : "#64748b",
                            border: isActive ? "2px solid rgba(139,92,246,0.4)" : "1px solid rgba(200,215,240,0.4)",
                          }}>
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save to notebook */}
                <button className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-50"
                  style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
                  <BookOpen className="w-3.5 h-3.5" /> Save to Notebook
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Question viewer ───────────────────────── */}
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={glass}>
            {step === "config" ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.12)" }}>
                  <Sparkles className="w-7 h-7" style={{ color: "rgba(139,92,246,0.5)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Configure and generate</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                    Set your topic, difficulty and question count, then hit Generate.
                  </p>
                </div>
              </div>
            ) : step === "generating" ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-sm text-slate-500">Building your quiz…</p>
              </div>
            ) : current ? (
              <div className="flex flex-col h-full">
                {/* Question header */}
                <div className="px-5 py-3 shrink-0 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(200,220,255,0.4)", background: "rgba(248,250,255,0.7)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                      {activeIdx + 1}
                    </span>
                    <span className="text-xs text-slate-400">of {questions.length}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ml-1 ${current.type === "mcq" ? "text-blue-600 bg-blue-50 border-blue-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"}`}>
                      {current.type === "mcq" ? "MCQ" : "Written"}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLORS[difficulty]}`}>
                      {difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setActiveIdx(p => Math.max(0, p - 1))} disabled={activeIdx === 0}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveIdx(p => Math.min(questions.length - 1, p + 1))} disabled={activeIdx === questions.length - 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Question text */}
                  <div className="text-sm font-medium text-slate-800 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {current.text}
                    </ReactMarkdown>
                  </div>

                  {/* MCQ options */}
                  {current.type === "mcq" && current.options && (
                    <div className="space-y-2">
                      {current.options.map((opt, j) => {
                        const isSelected = answers[current.id] === j;
                        const isSubmitted = submitted[current.id];
                        const isCorrect  = isSubmitted && j === current.answer;
                        const isWrong    = isSubmitted && isSelected && j !== current.answer;
                        return (
                          <button key={j} disabled={isSubmitted} onClick={() => answerQuestion(j)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                              isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800" :
                              isWrong   ? "bg-red-50 border-red-300 text-red-800" :
                              isSelected? "border-purple-300 text-purple-800" :
                              "border-transparent hover:border-slate-200 text-slate-700"
                            }`}
                            style={isSelected && !isSubmitted ? { background: "rgba(139,92,246,0.06)" } : {}}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2 ${
                              isCorrect ? "border-emerald-400 bg-emerald-100 text-emerald-700" :
                              isWrong   ? "border-red-400 bg-red-100 text-red-700" :
                              isSelected? "border-purple-400 bg-purple-50 text-purple-700" :
                              "border-slate-200 text-slate-500"
                            }`}>
                              {String.fromCharCode(65 + j)}
                            </span>
                            <span className="flex-1 prose-response text-sm">
                              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                {opt}
                              </ReactMarkdown>
                            </span>
                            {isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            {isWrong   && <X    className="w-4 h-4 text-red-500 shrink-0" />}
                          </button>
                        );
                      })}

                      {!submitted[current.id] && (
                        <button onClick={submitAnswer} disabled={answers[current.id] === undefined}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 3px 10px rgba(124,58,237,0.25)" }}>
                          Submit Answer
                        </button>
                      )}
                    </div>
                  )}

                  {/* Written answer */}
                  {current.type === "written" && (
                    <textarea rows={4} placeholder="Write your answer here…"
                      value={typeof answers[current.id] === "string" ? answers[current.id] as string : ""}
                      onChange={e => !submitted[current.id] && setAnswers(p => ({ ...p, [current.id]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none focus:ring-2 focus:ring-purple-300/40 transition-all"
                      style={{ background: "rgba(248,250,255,0.8)", border: "1px solid rgba(200,220,255,0.5)" }} />
                  )}

                  {/* Explanation */}
                  {(showExp[current.id] || submitted[current.id]) && current.explanation && (
                    <div className="rounded-xl px-4 py-3" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
                      <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1.5">Explanation</p>
                      <div className="prose-response text-xs">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {current.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom nav */}
                <div className="px-5 py-3 shrink-0 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(200,220,255,0.4)" }}>
                  <button onClick={() => setActiveIdx(p => Math.max(0, p - 1))} disabled={activeIdx === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <span className="text-xs text-slate-400">{activeIdx + 1} / {questions.length}</span>
                  <button onClick={() => setActiveIdx(p => Math.min(questions.length - 1, p + 1))} disabled={activeIdx === questions.length - 1}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
