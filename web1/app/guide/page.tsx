"use client";
import { useState, useRef, useEffect } from "react";
import {
  GraduationCap, BookOpen, ChevronDown, ChevronRight, ChevronLeft,
  Play, RotateCcw, Send, Bot, User, Loader2, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles, Trophy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "idle" | "loading" | "learning" | "done";

interface LearningRecord { id: string; title: string; type: string; selected: boolean; }
interface Notebook { id: string; name: string; color: string; expanded: boolean; records: LearningRecord[]; }
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface Lesson { title: string; subtitle: string; content: string; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_NOTEBOOKS: Notebook[] = [
  {
    id: "1", name: "Calculus Notes", color: "#3b82f6", expanded: true,
    records: [
      { id: "r1", title: "Integration by parts",    type: "solve",    selected: true  },
      { id: "r2", title: "Derivatives quiz",         type: "question", selected: false },
      { id: "r3", title: "Limits and continuity",    type: "solve",    selected: true  },
    ],
  },
  {
    id: "2", name: "Physics Notes", color: "#8b5cf6", expanded: false,
    records: [
      { id: "r4", title: "Newton's laws summary",   type: "research", selected: false },
      { id: "r5", title: "Kinematics problems",      type: "solve",    selected: false },
    ],
  },
  {
    id: "3", name: "Linear Algebra", color: "#10b981", expanded: false,
    records: [
      { id: "r6", title: "Eigenvalues explained",   type: "solve",    selected: false },
      { id: "r7", title: "Matrix operations",        type: "question", selected: false },
    ],
  },
];

const LESSONS: Lesson[] = [
  {
    title: "Introduction to Integration by Parts",
    subtitle: "Understanding the formula and when to use it",
    content: `## What is Integration by Parts?

Integration by parts is a technique used when integrating the **product of two functions**.

### The Formula

$$\\int u \\, dv = uv - \\int v \\, du$$

This comes directly from the **product rule** for differentiation:
$$\\frac{d}{dx}[uv] = u\\frac{dv}{dx} + v\\frac{du}{dx}$$

Integrating both sides gives us the integration by parts formula.

### When to Use It

Use integration by parts when you see a product of two different types of functions, such as:
- Polynomial × Exponential: $x e^x$
- Polynomial × Trig: $x \\cos x$
- Logarithm × Polynomial: $\\ln x \\cdot x$

> **Tip:** Use the **LIATE rule** to choose $u$: Logarithm, Inverse trig, Algebraic, Trig, Exponential.`,
  },
  {
    title: "Applying the Formula — Step by Step",
    subtitle: "Solving ∫ x eˣ dx with full workthrough",
    content: `## Solved Example: $\\int x e^x \\, dx$

Let's work through this step by step.

### Step 1 — Identify $u$ and $dv$

Using LIATE, the **algebraic** term $x$ becomes $u$, and the **exponential** $e^x\\,dx$ becomes $dv$:

$$u = x \\qquad dv = e^x \\, dx$$

### Step 2 — Compute $du$ and $v$

$$du = dx \\qquad v = \\int e^x \\, dx = e^x$$

### Step 3 — Apply the Formula

$$\\int x e^x \\, dx = \\underbrace{x \\cdot e^x}_{uv} - \\int \\underbrace{e^x}_{v} \\cdot \\underbrace{dx}_{du}$$

### Step 4 — Evaluate the Remaining Integral

$$= x e^x - e^x + C$$

### Final Answer

$$\\boxed{\\int x e^x \\, dx = e^x(x - 1) + C}$$`,
  },
  {
    title: "Repeated Integration by Parts",
    subtitle: "Tackling problems that require multiple applications",
    content: `## When One Application Isn't Enough

Some integrals require applying integration by parts **more than once**.

### Example: $\\int x^2 e^x \\, dx$

**First application** — Let $u = x^2$, $dv = e^x dx$:

$$\\int x^2 e^x \\, dx = x^2 e^x - 2\\int x e^x \\, dx$$

**Second application** — We already know $\\int x e^x\\,dx = e^x(x-1)+C$:

$$= x^2 e^x - 2\\bigl[e^x(x-1)\\bigr] + C$$

$$= e^x\\bigl(x^2 - 2x + 2\\bigr) + C$$

### The Tabular Method

For polynomials of higher degree, the **tabular (DI) method** is faster:

| $D$ (differentiate) | $I$ (integrate) |
|---|---|
| $x^2$ | $e^x$ |
| $2x$ | $e^x$ |
| $2$ | $e^x$ |
| $0$ | $e^x$ |

Result: $e^x(x^2 - 2x + 2) + C$ ✓`,
  },
  {
    title: "Special Cases and Practice",
    subtitle: "Cyclic integrals, trigonometric products, and more",
    content: `## Special Case: Cyclic Integrals

Some integrals reappear on the right side, creating a solvable equation.

### Example: $\\int e^x \\sin x \\, dx$

Let $I = \\int e^x \\sin x \\, dx$. Apply IBP twice:

**First:** $u = \\sin x$, $dv = e^x dx$

$$I = e^x \\sin x - \\int e^x \\cos x \\, dx$$

**Second:** $u = \\cos x$, $dv = e^x dx$

$$I = e^x \\sin x - \\left(e^x \\cos x + \\int e^x \\sin x \\, dx\\right)$$

$$I = e^x \\sin x - e^x \\cos x - I$$

**Solve for $I$:**

$$2I = e^x(\\sin x - \\cos x)$$

$$\\boxed{I = \\frac{e^x(\\sin x - \\cos x)}{2} + C}$$`,
  },
  {
    title: "Summary & Key Takeaways",
    subtitle: "Consolidating everything you've learned",
    content: `## Session Complete 🎓

Congratulations on finishing the **Integration by Parts** learning session!

### What You Learned

1. **The Formula:** $\\int u\\,dv = uv - \\int v\\,du$
2. **LIATE Rule** for choosing $u$
3. **Step-by-step method** for products like $xe^x$, $x^2e^x$
4. **Tabular method** for higher-degree polynomials
5. **Cyclic integrals** — when the integral reappears in the result

### Quick Reference

| Type | Example | Strategy |
|---|---|---|
| Poly × Exp | $x^n e^x$ | LIATE: $u=x^n$ |
| Poly × Trig | $x \\sin x$ | LIATE: $u=x$ |
| Log × Poly | $\\ln x$ | LIATE: $u=\\ln x$ |
| Exp × Trig | $e^x \\sin x$ | Cyclic — solve for $I$ |

### Next Steps

Practice with these integrals:
- $\\int x \\ln x \\, dx$
- $\\int x^3 e^{-x} \\, dx$
- $\\int e^{2x} \\cos x \\, dx$`,
  },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Great question! Let me explain that clearly.\n\nThe key idea here is choosing your $u$ and $dv$ wisely. The LIATE rule is your best guide — always try to pick $u$ as the function that **simplifies when differentiated**, and $dv$ as something easy to integrate.",
  why: "The formula $\\int u\\,dv = uv - \\int v\\,du$ comes from integrating both sides of the product rule. It transforms a hard integral into (hopefully) an easier one.",
};

const TYPE_COLORS: Record<string, string> = {
  solve:    "bg-blue-100 text-blue-600",
  question: "bg-purple-100 text-purple-600",
  research: "bg-emerald-100 text-emerald-600",
  chat:     "bg-amber-100 text-amber-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuidePage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [notebooks, setNotebooks]     = useState<Notebook[]>(INIT_NOTEBOOKS);
  const [status, setStatus]           = useState<SessionStatus>("idle");
  const [lessonIdx, setLessonIdx]     = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]     = useState("");
  const [isAsking, setIsAsking]       = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [lessonIdx]);

  const selectedRecords = notebooks.flatMap(n => n.records).filter(r => r.selected);
  const selectedCount   = selectedRecords.length;
  const progress        = status === "done" ? 100
    : status === "learning" ? Math.round(((lessonIdx + 1) / LESSONS.length) * 100)
    : 0;

  const toggleNb = (id: string) =>
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, expanded: !nb.expanded } : nb));

  const toggleRecord = (nbId: string, recId: string) =>
    setNotebooks(prev => prev.map(nb => nb.id !== nbId ? nb : {
      ...nb, records: nb.records.map(r => r.id === recId ? { ...r, selected: !r.selected } : r),
    }));

  const startSession = async () => {
    setStatus("loading");
    await new Promise(r => setTimeout(r, 1400));
    setLessonIdx(0);
    setChatMessages([]);
    setStatus("learning");
  };

  const nextLesson = () => {
    if (lessonIdx < LESSONS.length - 1) setLessonIdx(i => i + 1);
    else setStatus("done");
  };

  const prevLesson = () => {
    if (lessonIdx > 0) setLessonIdx(i => i - 1);
  };

  const reset = () => {
    setStatus("idle");
    setLessonIdx(0);
    setChatMessages([]);
  };

  const askQuestion = async () => {
    const q = chatInput.trim();
    if (!q || isAsking) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: q }]);
    setIsAsking(true);
    await new Promise(r => setTimeout(r, 1100));
    const reply = q.toLowerCase().includes("why") ? MOCK_RESPONSES.why : MOCK_RESPONSES.default;
    setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setIsAsking(false);
  };

  const _inner = (
      <div className="flex h-full overflow-hidden animate-fade-up">

        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-col shrink-0 overflow-hidden transition-all duration-300 border-r border-white/20"
          style={{
            width: leftCollapsed ? "40px" : "300px",
            background: "rgba(255,255,255,0.38)",
            backdropFilter: "blur(10px)",
          }}
        >
          {leftCollapsed ? (
            /* Collapsed strip */
            <div className="flex flex-col items-center pt-3 gap-2">
              <button onClick={() => setLeftCollapsed(false)}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                <ChevronRight className="w-4 h-4"/>
              </button>
              <GraduationCap className="w-4 h-4 text-indigo-400"/>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500"/>Guided Learning
                </span>
                <button onClick={() => setLeftCollapsed(true)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">

                {/* ── Notebook Selector (idle or always visible) ── */}
                <div className="shrink-0">
                  <div className="px-4 py-2.5 border-b border-white/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5"/>Source Records
                    </span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-600">
                        {selectedCount} selected
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-white/30">
                    {notebooks.map(nb => (
                      <div key={nb.id}>
                        <button onClick={() => toggleNb(nb.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/30 transition-colors">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nb.color }}/>
                          <span className="text-sm font-medium text-slate-700 flex-1 text-left truncate">{nb.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {nb.records.filter(r => r.selected).length}/{nb.records.length}
                          </span>
                          {nb.expanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0"/>}
                        </button>
                        {nb.expanded && nb.records.map(rec => (
                          <button key={rec.id} onClick={() => toggleRecord(nb.id, rec.id)}
                            className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 text-xs transition-colors ${rec.selected ? "bg-indigo-50/70" : "hover:bg-white/30"}`}>
                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${rec.selected ? "bg-indigo-500 border-indigo-500" : "border-slate-300"}`}>
                              {rec.selected && <div className="w-1.5 h-1.5 rounded-sm bg-white"/>}
                            </div>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${TYPE_COLORS[rec.type] ?? "bg-slate-100 text-slate-500"}`}>
                              {rec.type}
                            </span>
                            <span className="text-slate-600 truncate">{rec.title}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Progress + Controls ── */}
                {status !== "idle" && (
                  <div className="px-4 py-3 shrink-0 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Progress</span>
                      <span className={`font-bold ${progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? "#10b981" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                        }}/>
                    </div>
                    {/* Step dots */}
                    <div className="flex gap-1 justify-center">
                      {LESSONS.map((_, i) => (
                        <div key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i < lessonIdx ? "bg-indigo-400 w-3"
                            : i === lessonIdx && status === "learning" ? "bg-indigo-600 w-5"
                            : "bg-slate-200 w-1.5"
                          }`}/>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      {status === "learning" && (
                        <>
                          <button onClick={prevLesson} disabled={lessonIdx === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors text-slate-600">
                            <ArrowLeft className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={nextLesson}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            {lessonIdx < LESSONS.length - 1 ? <><ArrowRight className="w-3.5 h-3.5"/>Next</> : <><CheckCircle2 className="w-3.5 h-3.5"/>Finish</>}
                          </button>
                          <button onClick={reset}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-colors text-slate-500">
                            <RotateCcw className="w-3.5 h-3.5"/>
                          </button>
                        </>
                      )}
                      {status === "done" && (
                        <button onClick={reset}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5"/>New Session
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Start button (idle) */}
                {status === "idle" && (
                  <div className="px-4 py-3 border-t border-white/20 shrink-0">
                    <button onClick={startSession} disabled={selectedCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                      <Play className="w-4 h-4"/>Start Learning
                    </button>
                    {selectedCount === 0 && (
                      <p className="text-[10px] text-slate-400 text-center mt-1.5">
                        Select at least one record above
                      </p>
                    )}
                  </div>
                )}

                {/* ── Q&A Chat ── */}
                {status === "learning" && (
                  <div className="flex-1 flex flex-col min-h-0 border-t border-white/20">
                    <div className="px-4 py-2.5 shrink-0 flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-indigo-500"/>
                      <span className="text-xs font-semibold text-slate-600">Ask a Question</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 space-y-2 min-h-0 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                      {chatMessages.length === 0 && (
                        <p className="text-[11px] text-slate-400 text-center py-3">
                          Ask anything about the current lesson…
                        </p>
                      )}
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex gap-1.5 ${m.role === "user" ? "justify-end" : ""}`}>
                          {m.role === "assistant" && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                              <Bot className="w-3 h-3 text-white"/>
                            </div>
                          )}
                          <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                            m.role === "user"
                              ? "bg-indigo-100 text-indigo-800"
                              : "border border-slate-200/80 text-slate-700"
                          }`} style={m.role === "assistant" ? { background: "rgba(255,255,255,0.8)" } : {}}>
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                          {m.role === "user" && (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3 h-3 text-slate-500"/>
                            </div>
                          )}
                        </div>
                      ))}
                      {isAsking && (
                        <div className="flex gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            <Loader2 className="w-3 h-3 text-white animate-spin"/>
                          </div>
                          <div className="px-3 py-2 rounded-xl border border-slate-200/80"
                            style={{ background: "rgba(255,255,255,0.8)" }}>
                            <div className="flex gap-1">
                              {[0,1,2].map(j => (
                                <span key={j} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                                  style={{ animationDelay: `${j * 0.2}s` }}/>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef}/>
                    </div>
                    <div className="px-3 py-2 border-t border-white/20 shrink-0 flex items-center gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && askQuestion()}
                        placeholder="Ask about this topic…"
                        className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400"/>
                      <button onClick={askQuestion} disabled={!chatInput.trim() || isAsking}
                        className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-40 shrink-0"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        <Send className="w-3 h-3 text-white"/>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel: Content Viewer ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Expand button when left is collapsed */}
          {leftCollapsed && (
            <button onClick={() => setLeftCollapsed(false)}
              className="absolute top-4 left-4 z-10 p-1.5 rounded-lg shadow-sm border border-slate-200/80 hover:bg-white/80 transition-colors"
              style={{ background: "rgba(255,255,255,0.7)" }}>
              <ChevronRight className="w-4 h-4 text-slate-600"/>
            </button>
          )}

          {status === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 p-8">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>
                <GraduationCap className="w-12 h-12 text-slate-300"/>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-700">Guided Learning</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
                  Select records from your notebooks on the left, then click{" "}
                  <strong className="text-indigo-500">Start Learning</strong>. The AI will generate a
                  personalized step-by-step lesson with LaTeX-rendered math, interactive Q&A, and a
                  completion summary.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {["Math", "Physics", "History", "CS"].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 border border-slate-200"
                    style={{ background: "rgba(255,255,255,0.6)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin"/>
              <p className="text-sm font-medium text-slate-600">Generating your personalized lesson plan…</p>
              <p className="text-xs text-slate-400">Analyzing {selectedCount} record{selectedCount !== 1 ? "s" : ""}</p>
            </div>
          )}

          {status === "learning" && (
            <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
              {/* Lesson header */}
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-600">
                        Lesson {lessonIdx + 1} of {LESSONS.length}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400"/>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">{LESSONS[lessonIdx].title}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{LESSONS[lessonIdx].subtitle}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button onClick={prevLesson} disabled={lessonIdx === 0}
                      className="p-2 rounded-lg bg-white/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 disabled:opacity-30 transition-all">
                      <ArrowLeft className="w-4 h-4 text-slate-600"/>
                    </button>
                    <button onClick={nextLesson}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                      {lessonIdx < LESSONS.length - 1 ? <><ArrowRight className="w-3.5 h-3.5"/>Next</> : <><CheckCircle2 className="w-3.5 h-3.5"/>Finish</>}
                    </button>
                  </div>
                </div>

                {/* Lesson content */}
                <div className="rounded-2xl border border-slate-200/80 px-8 py-7 shadow-sm"
                  style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(6px)" }}>
                  <div className="prose-response">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {LESSONS[lessonIdx].content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between pt-2 pb-6">
                  <button onClick={prevLesson} disabled={lessonIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-white/60 disabled:opacity-30 transition-all border border-transparent hover:border-slate-200/80">
                    <ArrowLeft className="w-4 h-4"/>Previous
                  </button>
                  <div className="flex gap-1.5">
                    {LESSONS.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === lessonIdx ? "bg-indigo-600 scale-125" : i < lessonIdx ? "bg-indigo-300" : "bg-slate-200"}`}/>
                    ))}
                  </div>
                  <button onClick={nextLesson}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    {lessonIdx < LESSONS.length - 1 ? <>Next<ArrowRight className="w-4 h-4"/></> : <>Finish<CheckCircle2 className="w-4 h-4"/>  </>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 40px rgba(16,185,129,0.25)" }}>
                <Trophy className="w-10 h-10 text-white"/>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Session Complete!</h2>
                <p className="text-slate-500 text-sm mt-2">
                  You've completed all <strong>{LESSONS.length} lessons</strong> in this learning session.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
                {[
                  { label: "Lessons", value: LESSONS.length, color: "text-indigo-600" },
                  { label: "Questions", value: chatMessages.filter(m => m.role === "user").length, color: "text-blue-600" },
                  { label: "Progress", value: "100%", color: "text-emerald-600" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl p-4 border border-slate-200/80 text-center"
                    style={{ background: "rgba(255,255,255,0.7)" }}>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={reset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <RotateCcw className="w-4 h-4"/>Start New Session
              </button>
            </div>
          )}
        </div>
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
