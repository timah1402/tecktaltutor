"use client";
import { useState } from "react";
import {
  BookOpen, Plus, Trash2, Search, Clock,
  FileText, Calculator, Microscope, PenTool,
  ChevronRight, ChevronLeft, X, Check,
  MessageSquare, Download, FolderOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordType = "solve" | "question" | "research" | "co_writer" | "chat";

interface NbRecord {
  id: string;
  type: RecordType;
  title: string;
  query: string;
  output: string;
  date: string;
}

interface Notebook {
  id: string;
  name: string;
  description: string;
  color: string;
  records: NbRecord[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#ef4444",
  "#f97316","#22c55e","#14b8a6","#6366f1",
];

const TYPE_CONFIG: Record<RecordType, { icon: any; label: string; style: string }> = {
  solve:     { icon: Calculator,    label: "Solver",    style: "text-blue-600 bg-blue-50 border-blue-200" },
  question:  { icon: FileText,      label: "Questions", style: "text-purple-600 bg-purple-50 border-purple-200" },
  research:  { icon: Microscope,    label: "Research",  style: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  co_writer: { icon: PenTool,       label: "Co-Writer", style: "text-amber-600 bg-amber-50 border-amber-200" },
  chat:      { icon: MessageSquare, label: "Chat",      style: "text-cyan-600 bg-cyan-50 border-cyan-200" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK: Notebook[] = [
  {
    id: "1", name: "Calculus Notes", description: "Integrals & derivatives", color: "#3b82f6",
    records: [
      {
        id: "r1", type: "solve", title: "Integration by parts", date: "Today",
        query: "Solve ∫x·eˣ dx step by step",
        output: `## Integration by Parts — $\\int x e^x \\, dx$\n\n**Formula:** $\\int u \\, dv = uv - \\int v \\, du$\n\n**Step 1** — Choose $u$ and $dv$:\n- $u = x \\Rightarrow du = dx$\n- $dv = e^x dx \\Rightarrow v = e^x$\n\n**Step 2** — Apply the formula:\n$$\\int x e^x \\, dx = x e^x - \\int e^x \\, dx = x e^x - e^x + C$$\n\n**Result:**\n$$\\boxed{\\int x e^x \\, dx = e^x(x-1) + C}$$`,
      },
      {
        id: "r2", type: "question", title: "Derivatives practice quiz", date: "Yesterday",
        query: "Generate 5 questions on derivatives",
        output: `## Derivatives Practice Quiz\n\n1. Find $\\frac{d}{dx}[\\sin(x^2)]$\n\n2. Apply the product rule to $f(x) = x^2 e^x$\n\n3. Differentiate $g(x) = \\ln(3x+1)$\n\n4. Find the second derivative of $h(x) = x^4 - 3x^2$\n\n5. Use the chain rule: $y = (2x^3 - 5)^4$`,
      },
    ],
  },
  {
    id: "2", name: "History Research", description: "WWI & Cold War notes", color: "#8b5cf6",
    records: [
      {
        id: "r3", type: "research", title: "WWI causes analysis", date: "2 days ago",
        query: "What were the main causes of World War I?",
        output: `## World War I — Main Causes\n\n### The MAIN acronym\n\n- **M**ilitarism — Arms race between European powers\n- **A**lliances — Triple Entente vs Triple Alliance\n- **I**mperialism — Competition for colonies\n- **N**ationalism — Rise of ethnic independence movements\n\n### The Spark\nThe assassination of Archduke Franz Ferdinand in Sarajevo (June 28, 1914) triggered the alliance system, escalating a regional conflict into a world war.`,
      },
      {
        id: "r4", type: "chat", title: "Cold War discussion", date: "Last week",
        query: "What were the main causes of the Cold War?",
        output: `## Cold War Discussion\n\n**User:** What were the main causes of the Cold War?\n\n**AI:** The Cold War (1947–1991) arose from ideological, political, and economic tensions between the US and USSR:\n\n1. **Ideological conflict** — capitalism vs. communism\n2. **Post-WWII power vacuum** — both superpowers filled the void left by weakened European nations\n3. **Nuclear deterrence** — MAD (Mutually Assured Destruction) prevented direct conflict\n4. **Proxy wars** — Korea, Vietnam, Afghanistan`,
      },
    ],
  },
  {
    id: "3", name: "Biology", description: "Cell biology & genetics", color: "#22c55e",
    records: [
      {
        id: "r5", type: "research", title: "DNA replication process", date: "3 days ago",
        query: "Explain the steps of DNA replication",
        output: `## DNA Replication\n\nDNA replication is **semi-conservative** — each new molecule retains one original strand.\n\n### Steps\n\n1. **Initiation** — Helicase unwinds the double helix at the origin of replication\n2. **Elongation**\n   - DNA Polymerase III adds nucleotides 5'→3'\n   - Leading strand: synthesised continuously\n   - Lagging strand: synthesised as Okazaki fragments\n3. **Termination** — DNA Polymerase I replaces RNA primers; Ligase seals nicks\n\n### Key enzymes\n| Enzyme | Function |\n|---|---|\n| Helicase | Unwinds DNA |\n| Primase | Synthesises RNA primer |\n| DNA Pol III | Extends new strand |\n| Ligase | Joins Okazaki fragments |`,
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotebookPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [notebooks, setNotebooks]         = useState<Notebook[]>(MOCK);
  const [selectedNb, setSelectedNb]       = useState<Notebook | null>(MOCK[0]);
  const [selectedRec, setSelectedRec]     = useState<NbRecord | null>(null);
  const [search, setSearch]               = useState("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [midCollapsed, setMidCollapsed]   = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [newColor, setNewColor]     = useState(COLORS[0]);

  const filteredNbs = notebooks.filter(nb =>
    nb.name.toLowerCase().includes(search.toLowerCase()) ||
    nb.description.toLowerCase().includes(search.toLowerCase())
  );

  const createNotebook = () => {
    if (!newName.trim()) return;
    const nb: Notebook = { id: Date.now().toString(), name: newName, description: newDesc, color: newColor, records: [] };
    setNotebooks(p => [...p, nb]);
    setNewName(""); setNewDesc(""); setShowCreate(false);
  };

  const deleteNotebook = (id: string) => {
    setNotebooks(p => p.filter(n => n.id !== id));
    if (selectedNb?.id === id) { setSelectedNb(null); setSelectedRec(null); }
  };

  const deleteRecord = (recId: string) => {
    if (!selectedNb) return;
    const updated = { ...selectedNb, records: selectedNb.records.filter(r => r.id !== recId) };
    setNotebooks(p => p.map(n => n.id === selectedNb.id ? updated : n));
    setSelectedNb(updated);
    if (selectedRec?.id === recId) setSelectedRec(null);
  };

  const exportMd = () => {
    if (!selectedRec) return;
    const blob = new Blob([`# ${selectedRec.title}\n\n## Query\n${selectedRec.query}\n\n## Output\n${selectedRec.output}`], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedRec.title.replace(/\s+/g, "_")}.md`;
    a.click();
  };

  const glass = {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(200,220,255,0.5)",
  } as const;

  // ── Render ──────────────────────────────────────────────────────────────────

  const _inner = (
    <>
      <div className="flex h-full gap-3 p-3 overflow-hidden">

        {/* ── Panel 1: Notebook list ──────────────────────── */}
        {!leftCollapsed ? (
          <div className="flex flex-col rounded-2xl overflow-hidden shrink-0 transition-all duration-300"
            style={{ ...glass, width: 220, boxShadow: "0 2px 16px rgba(100,130,200,0.09)" }}>

            {/* Header */}
            <div className="px-3 pt-3 pb-2.5 shrink-0"
              style={{ borderBottom: "1px solid rgba(200,220,255,0.4)", background: "rgba(240,245,255,0.6)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-800">Notebooks</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowCreate(true)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)" }}>
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => setLeftCollapsed(true)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-300/50"
                  style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(200,220,255,0.5)" }} />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNbs.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <FolderOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-400">No notebooks yet</p>
                </div>
              ) : filteredNbs.map(nb => (
                <div key={nb.id}
                  onClick={() => { setSelectedNb(nb); setSelectedRec(null); setMidCollapsed(false); }}
                  className={`px-2.5 py-2 rounded-xl cursor-pointer transition-all group ${selectedNb?.id === nb.id ? "border-2" : "border-2 border-transparent hover:bg-white/60"}`}
                  style={selectedNb?.id === nb.id ? { background: `${nb.color}12`, borderColor: `${nb.color}40` } : {}}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${nb.color}20`, color: nb.color }}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{nb.name}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />{nb.records.length} records
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteNotebook(nb.id); }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setLeftCollapsed(false)}
            className="self-start mt-1 w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 transition-all shrink-0"
            style={glass}>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ── Panel 2: Records list ───────────────────────── */}
        {!midCollapsed ? (
          <div className="flex flex-col rounded-2xl overflow-hidden shrink-0 transition-all duration-300"
            style={{ ...glass, width: 240, boxShadow: "0 2px 16px rgba(100,130,200,0.09)" }}>

            {/* Header */}
            <div className="px-3 pt-3 pb-2.5 shrink-0"
              style={{
                borderBottom: "1px solid rgba(200,220,255,0.4)",
                background: selectedNb ? `${selectedNb.color}0d` : "rgba(240,245,255,0.6)",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {selectedNb ? (
                    <>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${selectedNb.color}20`, color: selectedNb.color }}>
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedNb.name}</p>
                        {selectedNb.description && (
                          <p className="text-[10px] text-slate-400 truncate">{selectedNb.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">No notebook selected</p>
                  )}
                </div>
                <button onClick={() => setMidCollapsed(true)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0 ml-1">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Records */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {!selectedNb ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-400">Select a notebook</p>
                </div>
              ) : selectedNb.records.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <FileText className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-400">No records yet</p>
                </div>
              ) : selectedNb.records.map(rec => {
                const cfg = TYPE_CONFIG[rec.type];
                const Icon = cfg.icon;
                const active = selectedRec?.id === rec.id;
                return (
                  <div key={rec.id}
                    onClick={() => setSelectedRec(active ? null : rec)}
                    className={`px-2.5 py-2 rounded-xl cursor-pointer transition-all group border ${
                      active
                        ? "bg-white/80 border-slate-200"
                        : "border-transparent hover:bg-white/60 hover:border-slate-100"
                    }`}>
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${cfg.style}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{rec.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{rec.query}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{rec.date}
                          </span>
                          <button onClick={e => { e.stopPropagation(); deleteRecord(rec.id); }}
                            className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <button onClick={() => setMidCollapsed(false)}
            className="self-start mt-1 w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 transition-all shrink-0"
            style={glass}>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ── Panel 3: Record detail ──────────────────────── */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
          style={{ ...glass, boxShadow: "0 2px 16px rgba(100,130,200,0.09)" }}>

          {/* Header */}
          <div className="px-4 py-3 shrink-0 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(200,220,255,0.4)", background: "rgba(248,250,255,0.7)" }}>
            {selectedRec ? (
              <>
                <div className={`p-1.5 rounded-lg border shrink-0 ${TYPE_CONFIG[selectedRec.type].style}`}>
                  {(() => { const Icon = TYPE_CONFIG[selectedRec.type].icon; return <Icon className="w-3.5 h-3.5" />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedRec.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${TYPE_CONFIG[selectedRec.type].style}`}>
                      {TYPE_CONFIG[selectedRec.type].label}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{selectedRec.date}
                    </span>
                  </div>
                </div>
                <button onClick={exportMd}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0">
                  <Download className="w-3 h-3" /> .md
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-300" />
                <p className="text-sm text-slate-400">Select a record to view</p>
              </div>
            )}
          </div>

          {/* Content */}
          {selectedRec ? (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Query */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Query</p>
                <div className="px-3.5 py-2.5 rounded-xl text-sm text-slate-700"
                  style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.12)" }}>
                  {selectedRec.query}
                </div>
              </div>
              {/* Output */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Output</p>
                <div className="px-4 py-3 rounded-xl"
                  style={{ background: "rgba(248,250,255,0.8)", border: "1px solid rgba(200,215,240,0.4)" }}>
                  <div className="prose-response">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {selectedRec.output}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <FileText className="w-6 h-6" style={{ color: "rgba(99,102,241,0.4)" }} />
              </div>
              <p className="text-sm font-semibold text-slate-400">Select a record to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(15,25,60,0.45)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="w-full rounded-2xl animate-fade-up"
            style={{
              maxWidth: "320px",
              background: "rgba(248,251,255,0.99)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(200,220,255,0.5)",
              boxShadow: "0 8px 48px rgba(80,120,200,0.25)",
            }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}>
              <p className="text-sm font-bold text-slate-800">New Notebook</p>
              <button onClick={() => setShowCreate(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Notebook name…" autoFocus
                className="w-full px-3 py-2 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300/40"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,220,255,0.6)" }} />
              <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)…"
                className="w-full px-3 py-2 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300/40"
                style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,220,255,0.6)" }} />
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-indigo-400 scale-110" : ""}`}
                    style={{ background: c }} />
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-xl text-sm text-slate-600 transition-all"
                  style={{ background: "rgba(100,120,180,0.08)", border: "1px solid rgba(150,170,210,0.25)" }}>
                  Cancel
                </button>
                <button onClick={createNotebook} disabled={!newName.trim()}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow: "0 3px 12px rgba(79,142,247,0.3)" }}>
                  <Check className="w-3.5 h-3.5" /> Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
