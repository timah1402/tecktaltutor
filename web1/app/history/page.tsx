"use client";
import { useState } from "react";
import {
  History, Clock, Calculator, FileText,
  Microscope, MessageCircle, Search,
  X, Calendar, ChevronRight, BookOpen,
  ArrowLeft, Tag,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType = "solve" | "question" | "research" | "chat";

interface Entry {
  id: string;
  type: EntryType;
  title: string;
  summary: string;
  fullContent: string;
  date: string;
  time: string;
  tags?: string[];
  steps?: string[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EntryType, { icon: any; bg: string; text: string; border: string; label: string; accent: string }> = {
  solve:    { icon: Calculator,    bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200",    label: "Solver",   accent: "#3b82f6" },
  question: { icon: FileText,      bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-200",  label: "Questions",accent: "#8b5cf6" },
  research: { icon: Microscope,    bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "Research", accent: "#10b981" },
  chat:     { icon: MessageCircle, bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",   label: "Chat",     accent: "#f59e0b" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "solve",    label: "Solver" },
  { key: "research", label: "Research" },
  { key: "question", label: "Questions" },
  { key: "chat",     label: "Chat" },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: Entry[] = [
  {
    id: "1", type: "solve", title: "Integration by parts in calculus",
    summary: "Solved ∫x·eˣ dx step-by-step using u-substitution.",
    date: "Today", time: "2:30 PM",
    tags: ["Calculus", "Integration", "Math"],
    steps: [
      "Identify u = x and dv = eˣ dx",
      "Compute du = dx and v = eˣ",
      "Apply formula: ∫u dv = uv − ∫v du",
      "Result: ∫x·eˣ dx = x·eˣ − eˣ + C = eˣ(x−1) + C",
    ],
    fullContent: `## Integration by Parts — ∫x·eˣ dx

**Formula:** ∫u dv = uv − ∫v du

### Step-by-step solution

**Step 1 — Choose u and dv**
- Let u = x → du = dx
- Let dv = eˣ dx → v = eˣ

**Step 2 — Apply the formula**
$$\\int x \\cdot e^x \\, dx = x \\cdot e^x - \\int e^x \\, dx$$

**Step 3 — Evaluate the remaining integral**
$$= x \\cdot e^x - e^x + C$$

**Final Answer**
$$\\boxed{\\int x e^x \\, dx = e^x(x - 1) + C}$$

### Key takeaway
When one factor is a polynomial and the other is exponential, always let u = polynomial so that differentiation reduces complexity.`,
  },
  {
    id: "2", type: "research", title: "Quantum entanglement overview",
    summary: "Comprehensive report on Bell's theorem and non-locality.",
    date: "Today", time: "11:00 AM",
    tags: ["Quantum Physics", "Bell's Theorem", "Non-locality"],
    fullContent: `## Quantum Entanglement

Quantum entanglement is a phenomenon where two or more particles become correlated in such a way that the quantum state of each particle cannot be described independently.

### Bell's Theorem
Bell's theorem (1964) proves that no physical theory of local hidden variables can reproduce all the predictions of quantum mechanics. Experiments (Aspect, 1982) have confirmed quantum non-locality.

### Key concepts
- **Superposition** — a particle exists in multiple states simultaneously until measured
- **Non-locality** — entangled particles influence each other instantly regardless of distance
- **Decoherence** — interaction with the environment destroys quantum coherence

### Applications
1. Quantum cryptography (QKD)
2. Quantum teleportation
3. Quantum computing

### Summary
Entanglement challenges classical intuitions about separability and locality, and is a fundamental resource in quantum information science.`,
  },
  {
    id: "3", type: "question", title: "World War II practice questions",
    summary: "Generated 20 questions covering causes, battles, and aftermath.",
    date: "Yesterday", time: "4:15 PM",
    tags: ["History", "WWII", "Practice"],
    fullContent: `## World War II — Practice Questions

### Multiple Choice
1. What event directly triggered Britain and France to declare war on Germany?
   - A) Invasion of Poland ✓
   - B) Annexation of Austria
   - C) Battle of Britain
   - D) Fall of France

2. The Normandy landings (D-Day) took place on:
   - A) June 6, 1944 ✓
   - B) May 8, 1945
   - C) September 1, 1939
   - D) December 7, 1941

### Short Answer
3. Describe the significance of the Battle of Stalingrad in the context of the Eastern Front.

4. Explain the role of the Marshall Plan in post-war reconstruction.

### Essay Prompts
5. Analyze the long-term causes of World War II, focusing on the Treaty of Versailles and the rise of fascism.

6. To what extent was the dropping of atomic bombs on Hiroshima and Nagasaki justified?`,
  },
  {
    id: "4", type: "solve", title: "Newton's laws of motion",
    summary: "Applied F=ma to multi-body dynamics problems.",
    date: "Yesterday", time: "1:00 PM",
    tags: ["Physics", "Mechanics", "Newton"],
    fullContent: `## Newton's Laws of Motion — Problem Set

### Problem 1
A 5 kg block is pushed with a 20 N force on a frictionless surface. Find the acceleration.

**Solution:** F = ma → a = F/m = 20/5 = **4 m/s²**

### Problem 2
Two blocks (3 kg and 5 kg) are connected by a string over a pulley. Find the acceleration of the system.

**Solution:**
Net force = (5 − 3) × g = 2 × 9.8 = 19.6 N
Total mass = 8 kg
a = 19.6 / 8 = **2.45 m/s²**

### Problem 3
A 10 kg object on a surface with μ = 0.3 is pulled by a 40 N force. Find the net acceleration.

**Solution:**
Friction = μmg = 0.3 × 10 × 9.8 = 29.4 N
Net force = 40 − 29.4 = 10.6 N
a = 10.6 / 10 = **1.06 m/s²**`,
  },
  {
    id: "5", type: "research", title: "Climate change impacts 2024",
    summary: "Deep research on global temperature trends and tipping points.",
    date: "March 20", time: "9:00 AM",
    tags: ["Climate", "Environment", "Science"],
    fullContent: `## Climate Change Impacts — 2024 Report

### Temperature Trends
Global average surface temperature in 2023 was approximately 1.45°C above pre-industrial levels, the highest ever recorded.

### Key Tipping Points
| Tipping Point | Threshold | Status |
|---|---|---|
| Arctic sea ice loss | ~1.5°C | Near critical |
| Greenland ice sheet | ~1.5°C | Approaching |
| Amazon dieback | ~2°C | At risk |
| Atlantic circulation | ~4°C | Monitoring |

### Observed Impacts
- **Extreme weather** — frequency and intensity of hurricanes, droughts, and floods increasing
- **Sea level rise** — 3.6 mm/year average rise, accelerating
- **Biodiversity** — ~1 million species threatened with extinction

### Mitigation Pathways
1. Rapid decarbonization (net zero by 2050)
2. Nature-based solutions (reforestation, wetland restoration)
3. Carbon capture technologies
4. Energy efficiency improvements`,
  },
  {
    id: "6", type: "chat", title: "Discussion on photosynthesis",
    summary: "Explored light reactions, the Calvin cycle, and limiting factors.",
    date: "Today", time: "8:00 AM",
    tags: ["Biology", "Plants", "Biochemistry"],
    fullContent: `## Chat Session — Photosynthesis

**You:** Can you explain how photosynthesis works?

**AI:** Photosynthesis occurs in two main stages: the light-dependent reactions and the Calvin cycle (light-independent reactions).

**You:** What happens in the light reactions exactly?

**AI:** In the thylakoid membranes, chlorophyll absorbs light energy to split water molecules (photolysis), releasing O₂ as a by-product. This energy is used to produce ATP and NADPH, which power the next stage.

**You:** And the Calvin cycle?

**AI:** In the stroma, CO₂ is fixed using ATP and NADPH from the light reactions. The enzyme RuBisCO catalyzes the fixation, and through a series of reactions, glucose is synthesised. It takes 3 turns of the cycle to produce one molecule of G3P.

**You:** What limits the rate of photosynthesis?

**AI:** The three main limiting factors are:
1. **Light intensity** — more light = faster reactions up to saturation point
2. **CO₂ concentration** — more CO₂ = faster Calvin cycle
3. **Temperature** — enzymes work faster up to their optimum (~25°C), then denature`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Entry | null>(null);

  const filtered = MOCK_ENTRIES.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, Entry[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="flex flex-col h-full">

        {/* ── Top bar ──────────────────────────────────────────── */}
        <div
          className="shrink-0 px-5 pt-2 pb-3 space-y-3"
          style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500 shrink-0" />
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">History</h1>
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(79,142,247,0.1)", color: "#3b82f6" }}
            >
              {filtered.length} items
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300/40 transition-all"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(200,220,255,0.6)",
                backdropFilter: "blur(12px)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={
                    active
                      ? { background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)", color: "#fff", boxShadow: "0 3px 10px rgba(79,142,247,0.35)" }
                      : { background: "rgba(255,255,255,0.7)", color: "#64748b", border: "1px solid rgba(200,215,240,0.6)" }
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Entry list ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.12)" }}
              >
                <BookOpen className="w-7 h-7" style={{ color: "rgba(79,142,247,0.4)" }} />
              </div>
              <p className="text-sm font-semibold text-slate-500">No entries found</p>
              <p className="text-xs text-slate-400">Try a different filter or search term</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(200,215,240,0.5)" }} />
                </div>

                {/* Cards */}
                <div className="space-y-2.5">
                  {entries.map((entry) => {
                    const cfg = TYPE_CONFIG[entry.type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setSelected(entry)}
                        className="w-full text-left rounded-2xl transition-all duration-200 active:scale-[0.98] group"
                        style={{
                          background: "rgba(255,255,255,0.78)",
                          backdropFilter: "blur(16px)",
                          border: "1px solid rgba(200,220,255,0.5)",
                          boxShadow: "0 2px 12px rgba(100,130,200,0.07)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px rgba(100,130,200,0.15)`;
                          (e.currentTarget as HTMLElement).style.borderColor = `rgba(${cfg.accent === "#3b82f6" ? "59,130,246" : cfg.accent === "#10b981" ? "16,185,129" : cfg.accent === "#8b5cf6" ? "139,92,246" : "245,158,11"},0.35)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(100,130,200,0.07)";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,220,255,0.5)";
                        }}
                      >
                        <div className="flex items-start gap-3 p-4">
                          {/* Type icon */}
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}
                            style={{ border: `1px solid`, borderColor: cfg.border.replace("border-", "") }}
                          >
                            <Icon className={`w-5 h-5 ${cfg.text}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto shrink-0">
                                <Clock className="w-3 h-3" />
                                {entry.time}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug mt-1">
                              {entry.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {entry.summary}
                            </p>
                            {entry.tags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-full text-slate-500"
                                    style={{ background: "rgba(100,120,180,0.07)", border: "1px solid rgba(150,170,210,0.2)" }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors self-center shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Detail modal ─────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(15,25,60,0.45)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl overflow-hidden animate-slide-up"
            style={{
              maxHeight: "90vh",
              background: "linear-gradient(180deg,rgba(248,251,255,0.98) 0%,rgba(240,247,255,0.98) 100%)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 -8px 48px rgba(80,120,200,0.2)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Modal header */}
            <div
              className="flex items-center gap-3 px-5 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}
            >
              {(() => {
                const cfg = TYPE_CONFIG[selected.type];
                const Icon = cfg.icon;
                return (
                  <>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{selected.title}</p>
                    </div>
                  </>
                );
              })()}
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 px-5 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(200,220,255,0.3)" }}>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {selected.date} · {selected.time}
              </span>
              {selected.tags && (
                <div className="flex gap-1 ml-2 flex-wrap">
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full text-slate-500 flex items-center gap-1"
                      style={{ background: "rgba(100,120,180,0.07)", border: "1px solid rgba(150,170,210,0.2)" }}
                    >
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Steps (if solver) */}
            {selected.steps && (
              <div className="px-5 pt-3 pb-2 shrink-0" style={{ borderBottom: "1px solid rgba(200,220,255,0.3)" }}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Steps</p>
                <ol className="space-y-1.5">
                  {selected.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: "rgba(79,142,247,0.12)", color: "#3b82f6" }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Full content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="prose-response">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {selected.fullContent}
                </ReactMarkdown>
              </div>
            </div>

            {/* Bottom actions */}
            <div
              className="flex gap-3 px-5 py-4 shrink-0"
              style={{ borderTop: "1px solid rgba(200,220,255,0.4)" }}
            >
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 text-sm font-medium transition-all"
                style={{ background: "rgba(100,120,180,0.08)", border: "1px solid rgba(150,170,210,0.25)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)",
                  boxShadow: "0 4px 14px rgba(79,142,247,0.35)",
                }}
              >
                Continue Session
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
