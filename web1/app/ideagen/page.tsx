"use client";
import { useState } from "react";
import {
  Lightbulb, BookOpen, ChevronDown, ChevronRight, ChevronLeft,
  Check, Save, Sparkles, Brain, Loader2, Zap, RefreshCw, X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteRecord { id: string; title: string; type: string; selected: boolean; }
interface Notebook   { id: string; name: string; color: string; expanded: boolean; records: NoteRecord[]; }
interface ResearchIdea {
  id: string;
  knowledge_point: string;
  description: string;
  research_ideas: string[];
  statement: string;
  tags: string[];
  expanded: boolean;
  selected: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  solve:    "bg-blue-100 text-blue-600",
  question: "bg-purple-100 text-purple-600",
  research: "bg-emerald-100 text-emerald-600",
  chat:     "bg-amber-100 text-amber-600",
};

const INIT_NBS: Notebook[] = [
  {
    id: "1", name: "Calculus Notes", color: "#3b82f6", expanded: true,
    records: [
      { id: "r1", title: "Integration by parts",  type: "solve",    selected: true  },
      { id: "r2", title: "Derivatives quiz",       type: "question", selected: false },
      { id: "r3", title: "Taylor series overview", type: "research", selected: true  },
    ],
  },
  {
    id: "2", name: "History Research", color: "#8b5cf6", expanded: false,
    records: [
      { id: "r4", title: "WWI causes analysis",  type: "research", selected: false },
      { id: "r5", title: "Cold War discussion",  type: "chat",     selected: false },
    ],
  },
  {
    id: "3", name: "Machine Learning", color: "#10b981", expanded: false,
    records: [
      { id: "r6", title: "Backpropagation notes",  type: "solve",    selected: false },
      { id: "r7", title: "CNN architecture quiz",  type: "question", selected: false },
    ],
  },
];

const MOCK_IDEAS: ResearchIdea[] = [
  {
    id: "1",
    knowledge_point: "Adaptive Calculus Tutoring System",
    description: "Leveraging integration techniques and Taylor expansions to build a personalized math tutor that adapts to student error patterns.",
    tags: ["EdTech", "AI", "Calculus"],
    research_ideas: [
      "Use error analysis on integration by parts mistakes to predict future misconceptions",
      "Auto-generate scaffolded hints using Taylor expansion analogies",
      "Build a difficulty-progression model based on student response latency",
      "Apply Bayesian knowledge tracing to track mastery of each technique",
    ],
    statement: `## Research Proposal

**Title:** Adaptive Calculus Tutoring via Integration Error Pattern Analysis

**Background**

Current tutoring systems treat all calculus errors equally. However, errors in **integration by parts** often follow predictable patterns — wrong choice of $u$, sign errors in $-\\int v\\,du$, or incomplete integration chains.

**Hypothesis**

By clustering common error types and modeling student knowledge as a hidden Markov chain, we can predict which technique a student will struggle with next and preemptively intervene.

**Methodology**

1. Collect anonymized student work on $\\int u\\,dv$ problems
2. Classify errors using an LLM-based rubric
3. Train a Bayesian Knowledge Tracing (BKT) model:
   $$P(L_t) = P(L_{t-1}) + (1-P(L_{t-1})) \\cdot P(T)$$
4. Generate targeted hints using Taylor expansion simplifications

**Expected Outcome**

A 30–40% reduction in repeated errors on integration technique problems within 5 practice sessions.`,
    expanded: false,
    selected: false,
  },
  {
    id: "2",
    knowledge_point: "Series Convergence Visualization Tool",
    description: "An interactive tool that renders Taylor and Maclaurin series partial sums, helping students build geometric intuition for convergence.",
    tags: ["Visualization", "Math", "Interactive"],
    research_ideas: [
      "Animate partial sum convergence with real-time slider control for degree $n$",
      "Highlight the radius of convergence visually on a complex plane",
      "Compare convergence speed across $e^x$, $\\sin x$, and $\\ln(1+x)$",
      "Integrate with a symbolic solver to auto-derive series from user input",
    ],
    statement: `## Research Proposal

**Title:** Real-Time Interactive Series Convergence Visualizer

**Motivation**

Students routinely memorize Taylor series formulas without understanding *why* they converge. A visual, interactive tool can bridge this gap.

**Core Features**

For a function $f(x)$, display the $n$-th partial sum:

$$S_n(x) = \\sum_{k=0}^{n} \\frac{f^{(k)}(a)}{k!}(x-a)^k$$

**Research Questions**

- Does animated convergence improve conceptual understanding compared to static diagrams?
- Which representation (graphical, numerical, symbolic) best reduces convergence misconceptions?

**Design**

An interactive slider controls $n$ from 0 to 20. The canvas shows $f(x)$ overlaid with $S_n(x)$, color-coded by $|f(x) - S_n(x)|$ (error heat map).

**Evaluation Plan**

Pre/post quiz measuring students' ability to estimate radius of convergence from a graph, compared to a control group using textbook examples only.`,
    expanded: false,
    selected: false,
  },
  {
    id: "3",
    knowledge_point: "AI-Powered Problem Variation Generator",
    description: "A system that takes a solved example and generates structurally equivalent problems at adjustable difficulty, preventing rote memorization.",
    tags: ["AI", "Problem Generation", "Assessment"],
    research_ideas: [
      "Use symbolic computation to swap functions while preserving integration technique",
      "Generate problems requiring the same method but with different surface features",
      "Rate generated problems by estimated difficulty using LLM scoring",
      "A/B test rote-memorized vs variation-trained students on transfer tasks",
    ],
    statement: `## Research Proposal

**Title:** Structural Problem Variation for Anti-Rote Mathematics Assessment

**Problem Statement**

Students who see $\\int x e^x\\,dx$ solved often directly copy the method for $\\int x e^{2x}\\,dx$ without understanding *why* LIATE applies. This is rote pattern matching, not genuine understanding.

**Proposed Solution**

Given a solved example, a variation generator should:

1. Parse the **technique** used (e.g., IBP with $u = \\text{polynomial}$, $dv = \\text{exponential}$)
2. Substitute equivalent function families that preserve the technique requirement
3. Adjust numeric constants to change computational difficulty without changing conceptual difficulty

**Example Variation Pipeline**

$$\\int x e^x\\,dx \\;\\longrightarrow\\; \\int x^2 e^{-3x}\\,dx \\;\\longrightarrow\\; \\int t^3 \\cos(2t)\\,dt$$

All require repeated IBP, but each has different surface features.

**Evaluation**

Compare two groups: one trained with varied problems, one with fixed examples. Measure transfer to novel problem types after 2 weeks.`,
    expanded: false,
    selected: false,
  },
  {
    id: "4",
    knowledge_point: "Cross-Domain Knowledge Connection Engine",
    description: "An AI system that surfaces non-obvious connections between notes from different domains, sparking interdisciplinary research ideas.",
    tags: ["Knowledge Graph", "NLP", "Discovery"],
    research_ideas: [
      "Build a semantic graph linking concepts across calculus, physics, and history notes",
      "Use cosine similarity on embedding vectors to surface unexpected connections",
      "Rank connection strength by citation co-occurrence in academic papers",
      "Present connections as 'bridge hypotheses' to guide exploration",
    ],
    statement: `## Research Proposal

**Title:** Semantic Bridge Discovery Across Multi-Domain Study Notes

**Core Insight**

Calculus notes about *rates of change* and history notes about *rates of social change* share deep structural similarity that current systems ignore. An embedding-based system can surface these bridges.

**Technical Approach**

1. Encode all notebook records as dense vectors using a sentence transformer
2. Construct a cross-notebook similarity graph $G = (V, E)$ where edge weight:
   $$w(r_i, r_j) = \\text{cosine}(\\mathbf{v}_i, \\mathbf{v}_j) \\cdot \\mathbb{1}[\\text{domain}(r_i) \\neq \\text{domain}(r_j)]$$
3. Extract high-weight cross-domain edges as "bridge concepts"
4. Generate bridge hypothesis text with an LLM: *"The derivative in calculus mirrors the marginal analysis in economics because…"*

**Validation**

Expert historians and mathematicians rate the quality of 50 AI-generated bridges on novelty, accuracy, and research potential (1–5 Likert scale).`,
    expanded: false,
    selected: false,
  },
];

const GEN_STATUSES = [
  "Analyzing source records…",
  "Extracting knowledge points…",
  "Generating research ideas…",
  "Drafting full statements…",
  "Finalizing results…",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IdeaGenPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [notebooks, setNotebooks]     = useState<Notebook[]>(INIT_NBS);
  const [thoughts, setThoughts]       = useState("");
  const [generating, setGenerating]   = useState(false);
  const [genStatus, setGenStatus]     = useState("");
  const [progress, setProgress]       = useState(0);
  const [ideas, setIdeas]             = useState<ResearchIdea[]>([]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const selectedSources = notebooks.flatMap(n => n.records).filter(r => r.selected).length;
  const selectedIdeas   = ideas.filter(i => i.selected).length;
  const canGenerate     = selectedSources > 0 || thoughts.trim().length > 0;

  const toggleNb = (id: string) =>
    setNotebooks(p => p.map(nb => nb.id === id ? { ...nb, expanded: !nb.expanded } : nb));

  const toggleRecord = (nbId: string, recId: string) =>
    setNotebooks(p => p.map(nb => nb.id !== nbId ? nb : {
      ...nb, records: nb.records.map(r => r.id === recId ? { ...r, selected: !r.selected } : r),
    }));

  const selectAll = (nbId: string, val: boolean) =>
    setNotebooks(p => p.map(nb => nb.id !== nbId ? nb : {
      ...nb, records: nb.records.map(r => ({ ...r, selected: val })),
    }));

  const clearAll = () =>
    setNotebooks(p => p.map(nb => ({ ...nb, records: nb.records.map(r => ({ ...r, selected: false })) })));

  const generate = async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setIdeas([]);
    setProgress(0);

    for (let i = 0; i < GEN_STATUSES.length; i++) {
      setGenStatus(GEN_STATUSES[i]);
      setProgress(Math.round(((i + 1) / GEN_STATUSES.length) * 100));
      await new Promise(r => setTimeout(r, 520));
    }

    // Stream ideas one by one
    for (let i = 0; i < MOCK_IDEAS.length; i++) {
      await new Promise(r => setTimeout(r, 320));
      setIdeas(prev => [...prev, MOCK_IDEAS[i]]);
    }

    setGenerating(false);
    setGenStatus("Completed!");
  };

  const toggleExpand = (id: string) =>
    setIdeas(p => p.map(idea => idea.id === id ? { ...idea, expanded: !idea.expanded } : idea));

  const toggleSelect = (id: string) =>
    setIdeas(p => p.map(idea => idea.id === id ? { ...idea, selected: !idea.selected } : idea));

  const selectAllIdeas = () => setIdeas(p => p.map(i => ({ ...i, selected: true })));
  const deselectAll    = () => setIdeas(p => p.map(i => ({ ...i, selected: false })));

  const _inner = (
      <div className="flex h-full overflow-hidden animate-fade-up">

        {/* ── Left Panel: Source Selection ───────────────────────────────── */}
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
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                <ChevronRight className="w-4 h-4"/>
              </button>
              <Lightbulb className="w-4 h-4 text-amber-500"/>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500"/>Source Records
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedSources > 0 && (
                    <button onClick={clearAll}
                      className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-0.5">
                      <X className="w-3 h-3"/>Clear ({selectedSources})
                    </button>
                  )}
                  <button onClick={() => setLeftCollapsed(true)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Notebook tree */}
              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/30">
                {INIT_NBS.map(nb => {
                  const cur = notebooks.find(n => n.id === nb.id)!;
                  return (
                    <div key={cur.id}>
                      <button onClick={() => toggleNb(cur.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/30 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cur.color }}/>
                        <span className="text-sm font-medium text-slate-700 flex-1 text-left truncate">{cur.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {cur.records.filter(r => r.selected).length}/{cur.records.length}
                        </span>
                        {cur.expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0"/>}
                      </button>
                      {cur.expanded && (
                        <div className="px-3 pb-2">
                          <div className="flex gap-2 mb-1.5 pl-5">
                            <button onClick={() => selectAll(cur.id, true)}
                              className="text-[11px] text-amber-600 hover:text-amber-700">Select All</button>
                            <span className="text-slate-300">·</span>
                            <button onClick={() => selectAll(cur.id, false)}
                              className="text-[11px] text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                          {cur.records.map(rec => (
                            <button key={rec.id} onClick={() => toggleRecord(cur.id, rec.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-all ${rec.selected ? "bg-amber-50/80" : "hover:bg-white/40"}`}>
                              <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${rec.selected ? "bg-amber-500 border-amber-500" : "border-slate-300"}`}>
                                {rec.selected && <Check className="w-2 h-2 text-white"/>}
                              </div>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[rec.type] ?? "bg-slate-100 text-slate-500"}`}>
                                {rec.type}
                              </span>
                              <span className="text-xs text-slate-600 truncate flex-1 text-left">{rec.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Thoughts textarea */}
              <div className="px-4 py-3 border-t border-white/20 shrink-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your Thoughts
                  <span className="font-normal normal-case text-slate-400 ml-1">
                    ({selectedSources > 0 ? "optional" : "required"})
                  </span>
                </p>
                <textarea rows={3} value={thoughts} onChange={e => setThoughts(e.target.value)}
                  placeholder="Describe your research direction, domain, or constraints…"
                  className="w-full rounded-xl px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none resize-none border border-slate-200/80 focus:border-amber-400 transition-colors"
                  style={{ background: "rgba(255,255,255,0.7)" }}/>
              </div>

              {/* Generate button */}
              <div className="px-4 pb-4 shrink-0">
                <button onClick={generate} disabled={generating || !canGenerate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all shadow-md"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}>
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin"/>Generating…</>
                    : <><Sparkles className="w-4 h-4"/>Generate Ideas{selectedSources > 0 ? ` (${selectedSources})` : ""}</>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel: Ideas ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/20"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(249,115,22,0.12))", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-3">
              {leftCollapsed && (
                <button onClick={() => setLeftCollapsed(false)}
                  className="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-slate-500">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(245,158,11,0.15)" }}>
                <Lightbulb className="w-5 h-5 text-amber-600"/>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">IdeaGen</p>
                <p className="text-[11px] text-slate-500">
                  {ideas.length > 0
                    ? `${ideas.length} research ideas generated`
                    : "Discover research ideas from your notes"}
                </p>
              </div>
            </div>
            {ideas.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={selectedIdeas === ideas.length ? deselectAll : selectAllIdeas}
                  className="text-xs text-amber-700 hover:text-amber-900 transition-colors">
                  {selectedIdeas === ideas.length ? "Deselect All" : "Select All"}
                </button>
                {selectedIdeas > 0 && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
                    <Save className="w-3.5 h-3.5"/>Save {selectedIdeas}
                  </button>
                )}
                <button onClick={() => { setIdeas([]); setGenStatus(""); }}
                  className="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-slate-400 hover:text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5"/>
                </button>
              </div>
            )}
          </div>

          {/* Generation status bar */}
          {(generating || genStatus) && (
            <div className="px-5 py-2.5 border-b border-white/20 shrink-0"
              style={{ background: "rgba(254,243,199,0.6)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {generating && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600"/>}
                  <span className="text-xs text-amber-700 font-medium">{genStatus}</span>
                </div>
                {generating && <span className="text-[10px] text-amber-600">{progress}%</span>}
              </div>
              {generating && (
                <div className="w-full h-1 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }}/>
                </div>
              )}
            </div>
          )}

          {/* Ideas list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
            {ideas.length === 0 && !generating ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>
                  <Brain className="w-10 h-10 text-slate-300"/>
                </div>
                <div>
                  <p className="font-semibold text-slate-600">Select records or describe your topic</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
                    IdeaGen will analyze your notes and generate novel research hypotheses,
                    complete with methodologies and research questions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Research Hypothesis", "Study Design", "Innovation Gap", "Cross-Domain Link"].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs text-amber-600 border border-amber-200"
                      style={{ background: "rgba(254,243,199,0.6)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              ideas.map(idea => (
                <div key={idea.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    idea.selected
                      ? "border-amber-300/70 shadow-[0_4px_20px_rgba(245,158,11,0.18)]"
                      : "border-slate-200/70 hover:border-slate-300/80"
                  }`}
                  style={{ background: idea.selected ? "rgba(255,251,235,0.85)" : "rgba(255,255,255,0.78)" }}>

                  {/* Card header */}
                  <div className="flex items-start gap-3 p-4">
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(idea.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        idea.selected ? "bg-amber-500 border-amber-500" : "border-slate-300 hover:border-amber-400"
                      }`}>
                      {idea.selected && <Check className="w-3 h-3 text-white"/>}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0"/>
                          {idea.knowledge_point}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {idea.research_ideas.length} ideas
                          </span>
                          <button onClick={() => toggleExpand(idea.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                            {idea.expanded
                              ? <ChevronDown className="w-4 h-4"/>
                              : <ChevronRight className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {idea.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {idea.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Research ideas bullets (collapsed preview) */}
                      {!idea.expanded && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {idea.research_ideas.slice(0, 2).map((ri, i) => (
                            <span key={i} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-lg max-w-xs truncate">
                              {ri.substring(0, 60)}{ri.length > 60 ? "…" : ""}
                            </span>
                          ))}
                          {idea.research_ideas.length > 2 && (
                            <span className="text-[11px] text-slate-400">+{idea.research_ideas.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded: full statement */}
                  {idea.expanded && (
                    <div className="px-5 pb-5 border-t border-slate-100/80 pt-4">
                      {/* All research ideas */}
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Research Ideas</p>
                      <ul className="space-y-1.5 mb-4">
                        {idea.research_ideas.map((ri, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-600">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 bg-amber-100 text-amber-700">
                              {i + 1}
                            </span>
                            {ri}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Full Proposal</p>
                      <div className="prose-response text-sm">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {idea.statement}
                        </ReactMarkdown>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors">
                          <Save className="w-3.5 h-3.5"/>Save to Notebook
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
