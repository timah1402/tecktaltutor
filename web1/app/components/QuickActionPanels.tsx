"use client";
import { useState } from "react";
import {
  Microscope, PenTool, Calculator, Edit3, GraduationCap,
  Lightbulb, BookOpen, Book, PhoneCall,
  Database, Globe, Sparkles, Play, Send, CheckCircle2,
  BrainCircuit, FileText, Upload, Wand2, Plus,
  Layers, MessageSquare, Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import VoiceOrb from "./VoiceOrb";

// ── Shared helpers ────────────────────────────────────────────────────────────

function PanelSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

const glass = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(200,220,255,0.55)",
  borderRadius: 16,
} as const;

function LaunchButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all"
      style={{ border: "1px solid rgba(200,220,255,0.5)" }}
    >
      Open standalone full page →
    </button>
  );
}

const KBS = ["Physics Notes", "Math Formulas", "History Essays", "Biology Textbook"];

// ── Research Panel ─────────────────────────────────────────────────────────────

type PlanMode = "quick" | "medium" | "deep" | "auto";
type ToolKey = "RAG" | "Paper" | "Web";

const EXAMPLE_TOPICS = [
  "Quantum Computing", "Climate Science", "Neural Networks",
  "Black Holes", "CRISPR Genomics",
];

export function ResearchPanel() {
  const [planMode, setPlanMode] = useState<PlanMode>("medium");
  const [tools, setTools] = useState<Set<ToolKey>>(new Set(["RAG", "Paper"]));
  const [topic, setTopic] = useState("");
  const [kb, setKb] = useState(KBS[0]);
  const router = useRouter();

  const toggleTool = (key: ToolKey) => {
    setTools((prev) => {
      const next = new Set(prev);
      if (next.size === 1 && next.has(key)) return prev;
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Microscope size={14} className="text-emerald-500" />
            Deep Research Lab
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            AI-powered multi-step research across your knowledge base, academic papers, and
            the web. Generates full reports with citations and LaTeX-rendered formulas.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div>
            <Label>Knowledge Base</Label>
            <select
              value={kb}
              onChange={(e) => setKb(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs text-slate-700 outline-none border border-slate-200/80"
              style={{ background: "rgba(255,255,255,0.8)" }}
            >
              {KBS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Plan Mode</Label>
            <div
              className="flex gap-0.5 p-0.5 rounded-xl"
              style={{
                background: "rgba(248,250,255,0.9)",
                border: "1px solid rgba(200,220,255,0.45)",
              }}
            >
              {(["quick", "medium", "deep", "auto"] as PlanMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPlanMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                    planMode === m
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Research Tools</Label>
            <div className="flex gap-2">
              {(
                [
                  { key: "RAG" as ToolKey, icon: Database, label: "RAG" },
                  { key: "Paper" as ToolKey, icon: GraduationCap, label: "Papers" },
                  { key: "Web" as ToolKey, icon: Globe, label: "Web" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => toggleTool(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    tools.has(key)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50/80 text-slate-400 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Research Topic</Label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && topic.trim() && router.push("/research")}
            placeholder="e.g. Quantum entanglement and its applications…"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200/80 focus:border-emerald-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.85)" }}
          />

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="px-2.5 py-1 rounded-full text-[10.5px] font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
                style={{ background: "rgba(209,250,229,0.4)" }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/research")}
            disabled={!topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
            }}
          >
            <Play size={14} />
            Start Research
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/research" />
      </PanelSection>
    </div>
  );
}

// ── Questions Panel ────────────────────────────────────────────────────────────

type QMode = "knowledge" | "mimic";
type Difficulty = "Easy" | "Medium" | "Hard";
type QType = "MCQ" | "Written" | "Mixed";

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

export function QuestionsPanel() {
  const [mode, setMode] = useState<QMode>("knowledge");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [qtype, setQtype] = useState<QType>("Mixed");
  const [count, setCount] = useState(10);
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <PenTool size={14} className="text-purple-500" />
            Question Generator
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Auto-generate MCQ and written practice questions from your knowledge base, or
            upload an exam paper to produce similar questions.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Mode</Label>
          <div
            className="flex p-0.5 rounded-xl gap-0.5"
            style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.14)",
            }}
          >
            {(["knowledge", "mimic"] as QMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "knowledge" ? <BrainCircuit size={12} /> : <FileText size={12} />}
                {m === "knowledge" ? "Custom" : "Mimic Exam"}
              </button>
            ))}
          </div>

          {mode === "knowledge" ? (
            <div>
              <Label>Topic / Knowledge Point</Label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Calculus derivatives, World War II…"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200/80 focus:border-purple-300 transition-colors"
                style={{ background: "rgba(255,255,255,0.85)" }}
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-2.5 py-5 rounded-xl cursor-pointer"
              style={{
                border: "2px dashed rgba(139,92,246,0.25)",
                background: "rgba(139,92,246,0.02)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Upload size={18} className="text-purple-300" />
              </div>
              <p className="text-xs font-medium text-slate-500">Drop exam PDF here</p>
              <p className="text-[10px] text-slate-400">or click to browse</p>
            </div>
          )}
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Difficulty</Label>
              <div className="flex gap-1">
                {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      difficulty === d
                        ? DIFF_COLORS[d]
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Count</Label>
              <div className="flex gap-1">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      count === n
                        ? "text-purple-700 bg-purple-50 border-purple-200"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Question Type</Label>
            <div className="flex gap-1.5">
              {(["MCQ", "Written", "Mixed"] as QType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setQtype(t)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    qtype === t
                      ? "text-purple-700 bg-purple-50 border-purple-200"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push("/question")}
            disabled={mode === "knowledge" && !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
              boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
            }}
          >
            <Sparkles size={14} />
            Generate {count} Questions
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/question" />
      </PanelSection>
    </div>
  );
}

// ── Solver Panel ───────────────────────────────────────────────────────────────

const SAMPLE_QS = [
  "Calculate the linear convolution of x=[1,2,3] and h=[4,5]",
  "Solve the differential equation dy/dx = x² + y",
  "Prove that ∑ k from 1 to n equals n(n+1)/2 by induction",
  "Find the eigenvalues of matrix [[2,1],[1,2]]",
];

export function SolverPanel() {
  const [input, setInput] = useState("");
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(6,182,212,0.06)",
            border: "1px solid rgba(6,182,212,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calculator size={14} className="text-cyan-500" />
            Smart Solver
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-agent STEM problem solver. Handles calculus, physics, proofs, linear
            algebra, and coding algorithms with step-by-step reasoning.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Your Problem</Label>
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a STEM problem or paste an equation…"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none border border-slate-200/80 focus:border-cyan-300 transition-colors"
            style={{ background: "rgba(255,255,255,0.85)" }}
          />
          <button
            onClick={() => router.push("/solver")}
            disabled={!input.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#06b6d4,#0891b2)",
              boxShadow: "0 4px 14px rgba(6,182,212,0.3)",
            }}
          >
            <Send size={14} />
            Solve Now
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-2" style={glass}>
          <Label>Quick Examples — click to try</Label>
          {SAMPLE_QS.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:text-cyan-700 hover:bg-cyan-50/80 border border-slate-200/70 transition-all"
              style={{ background: "rgba(255,255,255,0.7)" }}
            >
              {q}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/solver" />
      </PanelSection>
    </div>
  );
}

// ── Co-Writer Panel ────────────────────────────────────────────────────────────

type DocType = "Essay" | "Report" | "Blog" | "Letter" | "Summary" | "Code";
type Tone = "Formal" | "Casual" | "Academic" | "Creative";

const DOC_TYPE_ICONS: Record<DocType, React.ComponentType<{ size?: number; className?: string }>> = {
  Essay: FileText,
  Report: Layers,
  Blog: Edit3,
  Letter: MessageSquare,
  Summary: BookOpen,
  Code: Calculator,
};

export function CoWriterPanel() {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("Essay");
  const [tone, setTone] = useState<Tone>("Academic");
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Edit3 size={14} className="text-emerald-500" />
            AI Co-Writer
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Write essays, reports, summaries, and more with real-time AI assistance. Live
            Markdown preview with LaTeX math rendering.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Document Type</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["Essay", "Report", "Blog", "Letter", "Summary", "Code"] as DocType[]).map(
              (t) => {
                const Icon = DOC_TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold border transition-all ${
                      docType === t
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-slate-500 bg-white/60 border-slate-200/60 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={13} />
                    {t}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Document Title</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title or topic…"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200/80 focus:border-emerald-300 transition-colors"
            style={{ background: "rgba(255,255,255,0.85)" }}
          />

          <Label>Writing Tone</Label>
          <div className="flex gap-1.5">
            {(["Formal", "Casual", "Academic", "Creative"] as Tone[]).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-semibold border transition-all ${
                  tone === t
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/co_writer")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
            }}
          >
            <Wand2 size={14} />
            Open in Co-Writer
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/co_writer" />
      </PanelSection>
    </div>
  );
}

// ── Learning Panel ─────────────────────────────────────────────────────────────

type LearningMode = "Step-by-Step" | "Flash Cards" | "Quiz";

const SAMPLE_NOTEBOOKS = [
  { id: "1", name: "Calculus Notes", color: "#3b82f6", count: 3 },
  { id: "2", name: "Physics Notes", color: "#8b5cf6", count: 2 },
  { id: "3", name: "Linear Algebra", color: "#10b981", count: 2 },
];

export function LearningPanel() {
  const [mode, setMode] = useState<LearningMode>("Step-by-Step");
  const [selectedNb, setSelectedNb] = useState("1");
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <GraduationCap size={14} className="text-amber-500" />
            AI Learning Guide
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Turn your notes into interactive learning sessions with AI-generated
            explanations, flash cards, and adaptive quizzes.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Learning Mode</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["Step-by-Step", "Flash Cards", "Quiz"] as LearningMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2.5 rounded-xl text-[11px] font-semibold border transition-all ${
                  mode === m
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-slate-500 bg-white/60 border-slate-200/60 hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Source Notebook</Label>
          <div className="space-y-1.5">
            {SAMPLE_NOTEBOOKS.map((nb) => (
              <button
                key={nb.id}
                onClick={() => setSelectedNb(nb.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  selectedNb === nb.id
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-slate-200/60 bg-white/60 hover:bg-slate-50"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: nb.color }}
                />
                <span className="flex-1 text-xs font-medium text-slate-700 text-left">
                  {nb.name}
                </span>
                <span className="text-[10px] text-slate-400">{nb.count} records</span>
                {selectedNb === nb.id && (
                  <CheckCircle2 size={13} className="text-amber-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/guide")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
            }}
          >
            <Play size={14} />
            Start Learning Session
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/guide" />
      </PanelSection>
    </div>
  );
}

// ── IdeaGen Panel ──────────────────────────────────────────────────────────────

type IdeaType = "Research" | "Project" | "Essay" | "Experiment";

export function IdeaGenPanel() {
  const [kb, setKb] = useState(KBS[0]);
  const [ideaType, setIdeaType] = useState<IdeaType>("Research");
  const [count, setCount] = useState(5);
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(236,72,153,0.06)",
            border: "1px solid rgba(236,72,153,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Lightbulb size={14} className="text-pink-500" />
            Idea Generator
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatically generate research ideas, project proposals, and essay topics
            from your knowledge base content.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <Label>Knowledge Base</Label>
          <select
            value={kb}
            onChange={(e) => setKb(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs text-slate-700 outline-none border border-slate-200/80"
            style={{ background: "rgba(255,255,255,0.8)" }}
          >
            {KBS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>

          <Label>Idea Type</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["Research", "Project", "Essay", "Experiment"] as IdeaType[]).map((t) => (
              <button
                key={t}
                onClick={() => setIdeaType(t)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  ideaType === t
                    ? "text-pink-700 bg-pink-50 border-pink-200"
                    : "text-slate-500 bg-white/60 border-slate-200/60 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Label>Number of Ideas</Label>
          <div className="flex gap-1.5">
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  count === n
                    ? "text-pink-700 bg-pink-50 border-pink-200"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/ideagen")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#ec4899,#db2777)",
              boxShadow: "0 4px 14px rgba(236,72,153,0.3)",
            }}
          >
            <Zap size={14} />
            Generate {count} Ideas
          </button>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <LaunchButton href="/ideagen" />
      </PanelSection>
    </div>
  );
}

// ── Knowledge Panel ────────────────────────────────────────────────────────────

const MOCK_KBS_PANEL = [
  { name: "Physics Notes",  provider: "LlamaIndex",  docs: 12, status: "ready",      color: "#3b82f6" },
  { name: "History Essays", provider: "LightRAG",    docs: 7,  status: "ready",      color: "#8b5cf6" },
  { name: "Math Formulas",  provider: "RAGAnything", docs: 5,  status: "processing", color: "#10b981" },
];

export function KnowledgePanel() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <BookOpen size={14} className="text-indigo-500" />
            Knowledge Manager
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload and manage PDFs, documents, and notes. Powering all AI features with
            your personal, searchable knowledge base.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div className="flex items-center justify-between">
            <Label>Your Knowledge Bases</Label>
            <button
              onClick={() => router.push("/knowledge")}
              className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              <Plus size={11} />
              New
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_KBS_PANEL.map((kb, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200/60"
                style={{ background: "rgba(255,255,255,0.75)" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: kb.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{kb.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {kb.provider} · {kb.docs} docs
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    kb.status === "ready"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {kb.status === "ready" ? "Ready" : "Processing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4" style={glass}>
          <div
            className="flex flex-col items-center gap-2.5 py-4 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors"
            style={{
              border: "2px dashed rgba(99,102,241,0.25)",
              background: "rgba(99,102,241,0.02)",
            }}
            onClick={() => router.push("/knowledge")}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Upload size={18} className="text-indigo-300" />
            </div>
            <p className="text-xs font-medium text-slate-500">Upload new documents</p>
            <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, images supported</p>
          </div>
        </div>
      </PanelSection>

      <PanelSection delay={210}>
        <LaunchButton href="/knowledge" />
      </PanelSection>
    </div>
  );
}

// ── Notebooks Panel ────────────────────────────────────────────────────────────

const MOCK_NOTEBOOKS_PANEL = [
  { id: "1", name: "Calculus Notes", color: "#3b82f6", count: 5,  recent: "Integration by parts"  },
  { id: "2", name: "Physics Notes",  color: "#8b5cf6", count: 3,  recent: "Newton's laws summary" },
  { id: "3", name: "Biology",        color: "#10b981", count: 2,  recent: "Cell structure overview" },
];

export function NotebooksPanel() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(20,184,166,0.06)",
            border: "1px solid rgba(20,184,166,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Book size={14} className="text-teal-500" />
            Smart Notebooks
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Save and organize AI-generated solutions, research reports, and notes. Export
            as PDF or Markdown at any time.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div className="flex items-center justify-between">
            <Label>Your Notebooks</Label>
            <button
              onClick={() => router.push("/notebook")}
              className="flex items-center gap-1 text-[11px] text-teal-600 font-semibold hover:text-teal-800 transition-colors"
            >
              <Plus size={11} />
              New
            </button>
          </div>
          {MOCK_NOTEBOOKS_PANEL.map((nb) => (
            <button
              key={nb.id}
              onClick={() => router.push("/notebook")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-200/60 hover:border-teal-200 hover:bg-teal-50/30 transition-all"
              style={{ background: "rgba(255,255,255,0.75)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: nb.color + "15" }}
              >
                <Book size={14} style={{ color: nb.color }} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-700">{nb.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{nb.recent}</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                {nb.count}
              </span>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <LaunchButton href="/notebook" />
      </PanelSection>
    </div>
  );
}

// ── Voice Panel ────────────────────────────────────────────────────────────────

const VOICE_COMMANDS = [
  { cmd: "research [topic]", desc: "Start a research session"    },
  { cmd: "solve [problem]",  desc: "Open the STEM solver"        },
  { cmd: "questions",        desc: "Generate practice questions" },
  { cmd: "go back",          desc: "Navigate to previous page"   },
  { cmd: "open notebook",    desc: "Open your notebooks"         },
];

export function VoicePanel() {
  return (
    <div className="p-4 space-y-3 pb-8">
      <PanelSection delay={0}>
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: "rgba(79,142,247,0.06)",
            border: "1px solid rgba(79,142,247,0.18)",
          }}
        >
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <PhoneCall size={14} className="text-blue-500" />
            Voice Assistant
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hands-free navigation and question answering. Speaks back full explanations.
            Always listening in the background.
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={70}>
        <div
          className="flex flex-col items-center gap-4 rounded-2xl py-8"
          style={glass}
        >
          <VoiceOrb size="md" />
          <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
            Tap the orb or just speak — the AI will answer and navigate for you
          </p>
        </div>
      </PanelSection>

      <PanelSection delay={140}>
        <div className="rounded-2xl p-4 space-y-2" style={glass}>
          <Label>Voice Commands</Label>
          {VOICE_COMMANDS.map((vc, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200/40"
              style={{ background: "rgba(255,255,255,0.7)" }}
            >
              <code className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                {vc.cmd}
              </code>
              <span className="text-[11px] text-slate-500">{vc.desc}</span>
            </div>
          ))}
        </div>
      </PanelSection>
    </div>
  );
}
