"use client";
import { useState } from "react";
import { Lightbulb, Sparkles, Zap, BookOpen, ChevronDown, ChevronRight, Check, Brain, Save, Loader2 } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

interface NoteRecord { id: string; title: string; type: string; selected: boolean; }
interface Notebook { id: string; name: string; color: string; records: NoteRecord[]; expanded: boolean; }
interface Idea { id: string; title: string; description: string; tags: string[]; selected: boolean; expanded: boolean; statement: string; }

const TYPE_COLORS: Record<string, string> = {
  solve: "bg-blue-100 text-blue-600", question: "bg-purple-100 text-purple-600",
  research: "bg-emerald-100 text-emerald-600", chat: "bg-amber-100 text-amber-600",
};

const INIT_NBS: Notebook[] = [
  { id: "1", name: "Calculus Notes", color: "#3b82f6", expanded: false, records: [
    { id: "r1", title: "Integration by parts", type: "solve",    selected: false },
    { id: "r2", title: "Calculus quiz",         type: "question", selected: false },
  ]},
  { id: "2", name: "History Research", color: "#8b5cf6", expanded: false, records: [
    { id: "r3", title: "WWI causes analysis", type: "research", selected: false },
  ]},
];

const SAMPLE_IDEAS: Idea[] = [
  { id: "1", title: "AI-Powered Adaptive Flashcards", description: "A system that generates flashcards from your notes and adapts to your forgetting curve using spaced repetition.", tags: ["EdTech", "AI", "Memory"], selected: false, expanded: false,
    statement: "Develop an AI system that automatically generates flashcards from student notes and applies spaced repetition algorithms to optimize long-term retention. The system would analyze the semantic content of notes and create targeted questions at varying difficulty levels." },
  { id: "2", title: "Voice-First Study Planner", description: "Voice-controlled study schedule integrating calendar, deadlines, and adaptive pacing based on performance.", tags: ["Productivity", "Voice", "Planning"], selected: false, expanded: false,
    statement: "Create a voice-controlled study planning assistant that integrates with calendar systems, tracks academic deadlines, and dynamically adjusts study schedules based on student performance metrics and learning velocity." },
  { id: "3", title: "AR Textbook Annotation Overlay", description: "Augmented reality layer that overlays AI explanations on printed textbook pages when viewed through a phone.", tags: ["AR", "Reading", "AI"], selected: false, expanded: false,
    statement: "Design an augmented reality mobile application that uses computer vision to recognize textbook pages and overlays contextual AI-generated explanations, definitions, and related examples in real-time." },
  { id: "4", title: "Collaborative Equation Whiteboard", description: "Real-time collaborative whiteboard specialized for mathematical notation and equation solving.", tags: ["Collaboration", "Math", "Interactive"], selected: false, expanded: false,
    statement: "Build a real-time collaborative digital whiteboard optimized for mathematical content, supporting LaTeX rendering, symbolic computation, step-by-step verification, and multi-user editing with voice annotation." },
];

export default function IdeaGenPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INIT_NBS);
  const [thoughts, setThoughts] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const selectedSources = notebooks.flatMap(n => n.records).filter(r => r.selected).length;
  const selectedIdeas = ideas.filter(i => i.selected).length;

  const toggleRecord = (nbId: string, recId: string) =>
    setNotebooks(p => p.map(nb => nb.id === nbId ? { ...nb, records: nb.records.map(r => r.id === recId ? { ...r, selected: !r.selected } : r) } : nb));

  const toggleNb = (nbId: string) =>
    setNotebooks(p => p.map(nb => nb.id === nbId ? { ...nb, expanded: !nb.expanded } : nb));

  const selectAll = (nbId: string, val: boolean) =>
    setNotebooks(p => p.map(nb => nb.id === nbId ? { ...nb, records: nb.records.map(r => ({ ...r, selected: val })) } : nb));

  const generate = () => {
    if (selectedSources === 0 && !thoughts.trim()) return;
    setGenerating(true); setProgress(0); setIdeas([]);
    const interval = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(interval); return 100; } return p + 25; }), 500);
    setTimeout(() => { setGenerating(false); setIdeas(SAMPLE_IDEAS); }, 2200);
  };

  const toggleIdea = (id: string) => setIdeas(p => p.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const expandIdea = (id: string) => setIdeas(p => p.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i));
  const selectAllIdeas = () => setIdeas(p => p.map(i => ({ ...i, selected: true })));

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Lightbulb className="w-7 h-7 text-amber-500" />
            IdeaGen
          </h1>
          <p className="text-slate-500 text-sm mt-1">Discover research ideas from your notes</p>
        </div>

        {/* Source selector */}
        <GlassCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-white/60 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">Select Source</span>
            {selectedSources > 0 && (
              <button onClick={() => setNotebooks(p => p.map(nb => ({ ...nb, records: nb.records.map(r => ({ ...r, selected: false })) })))}
                className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors">
                Clear ({selectedSources})
              </button>
            )}
          </div>
          <div className="divide-y divide-white/40">
            {notebooks.map(nb => (
              <div key={nb.id}>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/30 transition-colors"
                  onClick={() => toggleNb(nb.id)}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nb.color }} />
                  <span className="text-sm font-medium text-slate-700 flex-1 text-left">{nb.name}</span>
                  <span className="text-xs text-slate-400">{nb.records.filter(r => r.selected).length}/{nb.records.length}</span>
                  {nb.expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {nb.expanded && (
                  <div className="px-4 pb-2">
                    <div className="flex gap-2 mb-1.5">
                      <button onClick={() => selectAll(nb.id, true)} className="text-[11px] text-blue-500 hover:text-blue-600">Select All</button>
                      <span className="text-slate-300">·</span>
                      <button onClick={() => selectAll(nb.id, false)} className="text-[11px] text-slate-400 hover:text-slate-500">Cancel</button>
                    </div>
                    {nb.records.map(rec => (
                      <button key={rec.id} onClick={() => toggleRecord(nb.id, rec.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1 text-sm transition-all ${rec.selected ? "bg-amber-50/80" : "hover:bg-white/40"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${rec.selected ? "bg-amber-500 border-amber-500" : "border-slate-300"}`}>
                          {rec.selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[rec.type] ?? ""}`}>{rec.type}</span>
                        <span className="text-slate-600 text-xs truncate flex-1 text-left">{rec.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Thoughts input */}
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Your Thoughts <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </p>
          <textarea rows={3} value={thoughts} onChange={e => setThoughts(e.target.value)}
            placeholder="Describe your research direction, domain, or any constraints…"
            className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 resize-none" />
        </GlassCard>

        {/* Generate button */}
        <button onClick={generate} disabled={generating || (selectedSources === 0 && !thoughts.trim())}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating ideas…</>
            : <><Sparkles className="w-4 h-4" />Generate Ideas{selectedSources > 0 ? ` from ${selectedSources} records` : ""}</>}
        </button>

        {/* Ideas panel */}
        {(generating || ideas.length > 0) && (
          <div>
            {/* Panel header */}
            <div className="rounded-2xl p-4 mb-3 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.1))", border: "1px solid rgba(251,191,36,0.3)" }}>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">IdeaGen Results</p>
                {generating
                  ? <div className="flex items-center gap-2 mt-0.5">
                      <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                      <span className="text-xs text-amber-600">{progress}% · Analyzing sources…</span>
                    </div>
                  : <p className="text-xs text-slate-500 mt-0.5">{ideas.length} ideas generated</p>}
              </div>
              {ideas.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={selectAllIdeas} className="text-xs text-slate-500 hover:text-slate-700">Select All</button>
                  {selectedIdeas > 0 && (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                      style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>
                      <Save className="w-3 h-3" />Save {selectedIdeas}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {generating && (
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Idea cards */}
            <div className="space-y-2.5">
              {ideas.map(idea => (
                <div key={idea.id}
                  className={`glass rounded-2xl transition-all overflow-hidden ${idea.selected ? "border-amber-300/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)]" : ""}`}
                  style={idea.selected ? { background: "rgba(254,243,199,0.6)" } : undefined}>
                  <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => expandIdea(idea.id)}>
                    <button className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${idea.selected ? "bg-blue-500 border-blue-500" : "border-slate-300 hover:border-blue-400"}`}
                      onClick={e => { e.stopPropagation(); toggleIdea(idea.id); }}>
                      {idea.selected && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />{idea.title}
                        </p>
                        {idea.expanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {idea.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {idea.expanded && (
                    <div className="px-4 pb-4 border-t border-white/60">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-2">Full Statement</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{idea.statement}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generating && ideas.length === 0 && (
          <GlassCard className="p-10 flex flex-col items-center text-center gap-3">
            <Brain className="w-14 h-14 text-slate-200" />
            <p className="font-semibold text-slate-500">Select records or describe your topic</p>
            <p className="text-xs text-slate-400 max-w-xs">IdeaGen will analyze your notes and generate novel research ideas and hypotheses</p>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
