"use client";
import { useState } from "react";
import {
  Book, Plus, ChevronDown, ChevronRight, Trash2, Edit3,
  Calculator, FileText, Microscope, MessageCircle, Edit,
  X, Check,
} from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

const RECORD_TYPE_CONFIG = {
  solve:    { icon: Calculator,    color: "text-blue-600",    bg: "bg-blue-100"    },
  question: { icon: FileText,      color: "text-purple-600",  bg: "bg-purple-100"  },
  research: { icon: Microscope,    color: "text-emerald-600", bg: "bg-emerald-100" },
  chat:     { icon: MessageCircle, color: "text-amber-600",   bg: "bg-amber-100"   },
  co_writer:{ icon: Edit,          color: "text-pink-600",    bg: "bg-pink-100"    },
};

const NOTEBOOK_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#06b6d4","#ef4444"];

interface NbRecord { id: string; type: string; title: string; preview: string; date: string; content: string; }
interface Notebook  { id: string; name: string; color: string; records: NbRecord[]; }

const MOCK: Notebook[] = [
  {
    id: "1", name: "Calculus Notes", color: "#3b82f6",
    records: [
      { id: "r1", type: "solve",    title: "Integration by parts",   preview: "∫x·eˣ dx = eˣ(x−1) + C",   date: "Today",     content: "**Solution:** ∫x·eˣ dx\n\nUsing integration by parts: u = x, dv = eˣ dx\n\n**Result:** eˣ(x − 1) + C" },
      { id: "r2", type: "question", title: "Calculus practice quiz",  preview: "20 questions on derivatives", date: "Yesterday", content: "1. What is the derivative of sin(x)?\n2. Apply the chain rule to f(g(x))..." },
    ],
  },
  {
    id: "2", name: "History Research", color: "#8b5cf6",
    records: [
      { id: "r3", type: "research", title: "WWI causes analysis",  preview: "Nationalism, imperialism…", date: "2 days ago", content: "## WWI Causes\n\n**Nationalism** played a major role..." },
      { id: "r4", type: "chat",     title: "Discussion: Cold War", preview: "AI-assisted conversation",   date: "Last week",  content: "**User:** What were the main causes of the Cold War?\n\n**AI:** The Cold War arose from..." },
    ],
  },
];

export default function NotebookPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(MOCK);
  const [activeNb, setActiveNb] = useState<string>("1");
  const [activeRecord, setActiveRecord] = useState<NbRecord | null>(null);
  const [recordFilter, setRecordFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(NOTEBOOK_COLORS[0]);

  const currentNb = notebooks.find(n => n.id === activeNb);
  const filteredRecords = currentNb?.records.filter(r => recordFilter === "all" || r.type === recordFilter) ?? [];

  const createNotebook = () => {
    if (!newName.trim()) return;
    setNotebooks(prev => [...prev, { id: Date.now().toString(), name: newName, color: newColor, records: [] }]);
    setNewName(""); setShowCreate(false);
  };

  const deleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(n => n.id !== id));
    if (activeNb === id && notebooks.length > 1) setActiveNb(notebooks.find(n => n.id !== id)!.id);
  };

  const RECORD_FILTERS = ["all", "solve", "question", "research", "chat", "co_writer"];

  // suppress unused import warnings
  void Trash2; void Edit3; void Check;

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <Book className="w-7 h-7 text-teal-600" />
              Notebooks
            </h1>
            <p className="text-slate-500 text-sm mt-1">Your saved records &amp; notes</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">New Notebook</p>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Notebook name…"
              className="w-full px-3 py-2.5 rounded-xl border border-white/80 bg-white/70 text-sm text-slate-700 placeholder:text-slate-400 outline-none" />
            <div className="flex gap-2">
              {NOTEBOOK_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-blue-400 scale-110" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
              <button onClick={createNotebook} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Create</button>
            </div>
          </GlassCard>
        )}

        {/* Notebook tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {notebooks.map(nb => (
            <button key={nb.id} onClick={() => { setActiveNb(nb.id); setActiveRecord(null); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                activeNb === nb.id ? "bg-white shadow-md text-slate-800" : "glass text-slate-600 hover:bg-white/80"
              }`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nb.color }} />
              {nb.name}
              <span className="text-[11px] text-slate-400">({nb.records.length})</span>
              {activeNb === nb.id && (
                <button onClick={e => { e.stopPropagation(); deleteNotebook(nb.id); }}
                  className="ml-0.5 p-0.5 rounded hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Record filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {RECORD_FILTERS.map(f => (
            <button key={f} onClick={() => setRecordFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all shrink-0 ${
                recordFilter === f ? "bg-white text-slate-800 shadow-sm" : "glass text-slate-500 hover:bg-white/70"
              }`}>
              {f === "co_writer" ? "Co-Writer" : f}
            </button>
          ))}
        </div>

        {/* Records */}
        <div className="space-y-2.5">
          {filteredRecords.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <Book className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No records yet</p>
            </GlassCard>
          ) : filteredRecords.map(rec => {
            const cfg = RECORD_TYPE_CONFIG[rec.type as keyof typeof RECORD_TYPE_CONFIG] ?? RECORD_TYPE_CONFIG.chat;
            const Icon = cfg.icon;
            const isOpen = activeRecord?.id === rec.id;
            return (
              <GlassCard key={rec.id} glow="blue" className="overflow-hidden">
                <div className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-white/40 transition-colors"
                  onClick={() => setActiveRecord(isOpen ? null : rec)}>
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{rec.title}</p>
                    <p className="text-xs text-slate-400 truncate">{rec.preview} · {rec.date}</p>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/60">
                    <pre className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">{rec.content}</pre>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
