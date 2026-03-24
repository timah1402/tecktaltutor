"use client";
import { useState } from "react";
import { GraduationCap, BookOpen, ChevronDown, ChevronRight, Play, RotateCcw, Send, Bot, User, Loader2 } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

interface LearningRecord { id: string; title: string; type: string; selected: boolean; }
interface Notebook { id: string; name: string; color: string; records: LearningRecord[]; expanded: boolean; }
interface ChatMessage { role: "user" | "assistant"; content: string; }

const INIT_NOTEBOOKS: Notebook[] = [
  { id: "1", name: "Calculus Notes", color: "#3b82f6", expanded: false, records: [
    { id: "r1", title: "Integration by parts", type: "solve",    selected: false },
    { id: "r2", title: "Calculus quiz",         type: "question", selected: false },
  ]},
  { id: "2", name: "History Research", color: "#8b5cf6", expanded: false, records: [
    { id: "r3", title: "WWI causes analysis",  type: "research", selected: false },
    { id: "r4", title: "Cold War discussion",  type: "chat",     selected: false },
  ]},
];

const LEARNING_CONTENT = [
  { title: "Introduction", content: "We'll start with the fundamentals of **integration by parts**.\n\nThis technique is used when integrating a product of two functions.\n\n**Formula:** ∫u dv = uv − ∫v du\n\nIn the next section, we'll apply this to real examples." },
  { title: "Application", content: "Let's apply integration by parts to **∫x·eˣ dx**.\n\n**Step 1:** Choose u = x and dv = eˣ dx\n**Step 2:** Then du = dx and v = eˣ\n**Step 3:** Apply: x·eˣ − ∫eˣ dx\n**Result:** eˣ(x − 1) + C ✓" },
  { title: "Summary",     content: "Excellent work! You've completed this learning session.\n\n**Key takeaways:**\n- Integration by parts mirrors the product rule\n- Choose u as the function that simplifies when differentiated\n- The LIATE rule helps choose u: Logarithm, Inverse trig, Algebraic, Trig, Exponential" },
];

const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default: "Great question! Integration by parts is a powerful technique. The key is choosing u and dv wisely — typically u should simplify when differentiated, and dv should be easy to integrate.",
};

export default function GuidePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INIT_NOTEBOOKS);
  const [step, setStep] = useState<"idle" | "learning" | "done">("idle");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [showSource, setShowSource] = useState(true);

  const selectedCount = notebooks.flatMap(n => n.records).filter(r => r.selected).length;

  const toggleRecord = (nbId: string, recId: string) => {
    setNotebooks(prev => prev.map(nb => nb.id === nbId
      ? { ...nb, records: nb.records.map(r => r.id === recId ? { ...r, selected: !r.selected } : r) }
      : nb));
  };

  const toggleNb = (nbId: string) => {
    setNotebooks(prev => prev.map(nb => nb.id === nbId ? { ...nb, expanded: !nb.expanded } : nb));
  };

  const startLearning = () => { setStep("learning"); setLessonIdx(0); };
  const nextLesson = () => {
    if (lessonIdx < LEARNING_CONTENT.length - 1) setLessonIdx(i => i + 1);
    else setStep("done");
  };
  const reset = () => { setStep("idle"); setLessonIdx(0); setChatMessages([]); };

  const askQuestion = async () => {
    if (!chatInput.trim() || isAsking) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: q }]);
    setIsAsking(true);
    // Mock response — no API call
    await new Promise(r => setTimeout(r, 1000));
    setChatMessages(prev => [...prev, { role: "assistant", content: MOCK_CHAT_RESPONSES.default }]);
    setIsAsking(false);
  };

  const progress = step === "done" ? 100 : step === "learning" ? Math.round(((lessonIdx + 1) / LEARNING_CONTENT.length) * 100) : 0;

  const TYPE_COLORS: Record<string,string> = { solve: "bg-blue-100 text-blue-600", question: "bg-purple-100 text-purple-600", research: "bg-emerald-100 text-emerald-600", chat: "bg-amber-100 text-amber-600" };

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Guided Learning
          </h1>
          <p className="text-slate-500 text-sm mt-1">Step-by-step tutoring from your notes</p>
        </div>

        {/* Source selector */}
        <GlassCard className="overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/40 transition-colors"
            onClick={() => setShowSource(s => !s)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Select Source Records
              {selectedCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-600">{selectedCount} selected</span>}
            </div>
            {showSource ? <ChevronDown className="w-4 h-4 text-slate-400"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
          </button>
          {showSource && (
            <div className="border-t border-white/60 divide-y divide-white/40">
              {notebooks.map(nb => (
                <div key={nb.id}>
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/30 transition-colors"
                    onClick={() => toggleNb(nb.id)}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nb.color }} />
                    <span className="text-sm font-medium text-slate-700 flex-1 text-left">{nb.name}</span>
                    <span className="text-xs text-slate-400">{nb.records.filter(r=>r.selected).length}/{nb.records.length}</span>
                    {nb.expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400"/> : <ChevronRight className="w-3.5 h-3.5 text-slate-400"/>}
                  </button>
                  {nb.expanded && nb.records.map(rec => (
                    <button key={rec.id} onClick={() => toggleRecord(nb.id, rec.id)}
                      className={`w-full flex items-center gap-3 pl-9 pr-4 py-2 text-sm transition-colors ${rec.selected ? "bg-indigo-50/80" : "hover:bg-white/30"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${rec.selected ? "bg-indigo-500 border-indigo-500" : "border-slate-300"}`}>
                        {rec.selected && <div className="w-2 h-2 rounded-sm bg-white" />}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[rec.type] ?? "bg-slate-100 text-slate-600"}`}>{rec.type}</span>
                      <span className="text-slate-600 truncate">{rec.title}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Progress + controls */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Learning Progress</span>
            <span className={`font-bold ${progress === 100 ? "text-emerald-600" : "text-indigo-600"}`}>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
          </div>
          <div className="flex gap-2">
            {step === "idle" && (
              <button onClick={startLearning} disabled={selectedCount === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Play className="w-4 h-4"/>Start Learning
              </button>
            )}
            {step === "learning" && (
              <>
                <button onClick={nextLesson}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {lessonIdx < LEARNING_CONTENT.length - 1 ? "Next →" : "Complete ✓"}
                </button>
                <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                  <RotateCcw className="w-4 h-4"/>
                </button>
              </>
            )}
            {step === "done" && (
              <button onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                <RotateCcw className="w-4 h-4"/>Reset
              </button>
            )}
          </div>
        </GlassCard>

        {/* Content area */}
        {step === "idle" ? (
          <GlassCard className="p-8 flex flex-col items-center text-center gap-3">
            <GraduationCap className="w-16 h-16 text-slate-200" />
            <p className="font-semibold text-slate-600">Select records and start learning</p>
            <p className="text-sm text-slate-400">The AI will guide you through your notes step by step</p>
          </GlassCard>
        ) : step === "done" ? (
          <GlassCard className="p-6 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="font-bold text-slate-800">Learning Complete!</p>
            <p className="text-sm text-slate-500">You&apos;ve finished all {LEARNING_CONTENT.length} lessons in this session.</p>
          </GlassCard>
        ) : (
          <GlassCard className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{LEARNING_CONTENT[lessonIdx].title}</span>
              <span className="text-xs text-slate-400 ml-auto">{lessonIdx + 1} / {LEARNING_CONTENT.length}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{LEARNING_CONTENT[lessonIdx].content}</p>
          </GlassCard>
        )}

        {/* Chat Q&A */}
        {step !== "idle" && (
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/60 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">Ask a Question</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Ask anything about the current topic…</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && <Bot className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5"/>}
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "bg-indigo-100 text-indigo-800" : "bg-white/80 text-slate-700 border border-slate-100"}`}>
                    {m.content}
                  </div>
                  {m.role === "user" && <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"/>}
                </div>
              ))}
              {isAsking && (
                <div className="flex gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0"/>
                  <div className="px-3 py-2 rounded-xl bg-white/80 border border-slate-100">
                    <div className="flex gap-1">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{animationDelay:`${i*0.2}s`}}/>)}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/60">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askQuestion()}
                placeholder="Ask about this topic…"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
              <button onClick={askQuestion} disabled={!chatInput.trim() || isAsking}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40 shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Send className="w-3.5 h-3.5 text-white"/>
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
