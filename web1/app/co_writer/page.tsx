"use client";
import { useState } from "react";
import { Edit3, Bold, Italic, List, Heading, Sparkles, Check, RefreshCw, X, Bot, Send, ChevronDown, ChevronUp, Save } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

const INIT_CONTENT = `# The Impact of Artificial Intelligence on Modern Education

Artificial intelligence is fundamentally transforming traditional pedagogical approaches and creating personalized learning experiences that adapt to individual student needs.

## Key Areas of Impact

### Personalized Learning
AI systems can analyze student performance data to identify gaps in understanding and adapt content delivery in real-time.

### Intelligent Tutoring
Modern AI tutors provide immediate feedback and can explain concepts in multiple ways until the student demonstrates understanding.`;

const SUGGESTIONS = [
  "...revolutionizing how educators design curriculum and assessment frameworks, moving away from one-size-fits-all approaches toward dynamic, data-driven educational pathways.",
  "...enabling unprecedented scalability in quality education delivery, making expert-level tutoring accessible to students regardless of geographic or socioeconomic constraints.",
  "...raising important questions about academic integrity, the role of human teachers, and the ethical implications of algorithmic decision-making in educational contexts.",
];

interface AssistantMsg { role: "user" | "assistant"; content: string; }

export default function CoWriterPage() {
  const [content, setContent] = useState(INIT_CONTENT);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMsgs, setAssistantMsgs] = useState<AssistantMsg[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [suggIdx, setSuggIdx] = useState(0);

  const handleChange = (val: string) => { setContent(val); setSaved(false); };

  const insertFormat = (before: string, after = "") => {
    setContent(p => p + before + after);
    setSaved(false);
  };

  const getAISuggestion = async () => {
    setLoading(true); setSuggestion(null);
    await new Promise(r => setTimeout(r, 1200));
    setSuggestion(SUGGESTIONS[suggIdx % SUGGESTIONS.length]);
    setLoading(false);
  };

  const acceptSuggestion = () => { setContent(p => p + "\n" + suggestion); setSuggestion(null); setSaved(false); };
  const regenSuggestion  = () => { setSuggIdx(i => i + 1); setSuggestion(SUGGESTIONS[(suggIdx + 1) % SUGGESTIONS.length]); };

  const askAssistant = async () => {
    if (!assistantInput.trim() || isAsking) return;
    const q = assistantInput.trim(); setAssistantInput("");
    setAssistantMsgs(p => [...p, { role: "user", content: q }]);
    setIsAsking(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `You are a writing assistant. The user is writing: "${content.slice(0, 200)}…". They ask: ${q}` }) });
      const data = await res.json();
      setAssistantMsgs(p => [...p, { role: "assistant", content: data.answer }]);
    } catch {
      setAssistantMsgs(p => [...p, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setIsAsking(false);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-3 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Edit3 className="w-7 h-7 text-purple-600" />
            Co-Writer
          </h1>
          <p className="text-slate-500 text-sm mt-1">Intelligent markdown editor with AI-powered writing assistance</p>
        </div>

        {/* Toolbar */}
        <GlassCard className="px-3 py-2 flex items-center gap-1 flex-wrap">
          {[
            { icon: Bold,    action: () => insertFormat("**", "**"), label: "Bold" },
            { icon: Italic,  action: () => insertFormat("*", "*"),   label: "Italic" },
            { icon: List,    action: () => insertFormat("\n- "),      label: "List" },
            { icon: Heading, action: () => insertFormat("\n## "),     label: "Heading" },
          ].map(({ icon: Icon, action, label }) => (
            <button key={label} onClick={action} title={label}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Icon className="w-4 h-4 text-slate-500" />
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button onClick={getAISuggestion} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {loading ? <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />Thinking…</> : <><Sparkles className="w-3.5 h-3.5" />AI Suggest</>}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{wordCount} words</span>
            {saved
              ? <span className="text-[11px] text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>
              : <button onClick={() => setSaved(true)} className="text-[11px] text-slate-400 flex items-center gap-1 hover:text-slate-600"><Save className="w-3 h-3" />Save</button>}
          </div>
        </GlassCard>

        {/* Writing canvas */}
        <GlassCard className="p-4">
          <textarea
            rows={14}
            value={content}
            onChange={e => handleChange(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-700 leading-relaxed resize-none placeholder:text-slate-400 font-mono"
            placeholder="Start writing…"
          />
        </GlassCard>

        {/* AI Suggestion */}
        {suggestion && (
          <GlassCard glow="violet" className="p-4 space-y-3 animate-fade-up">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">AI Suggestion</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">&ldquo;{suggestion}&rdquo;</p>
            <div className="flex gap-2">
              <button onClick={acceptSuggestion}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                <Check className="w-3.5 h-3.5" />Accept
              </button>
              <button onClick={regenSuggestion}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />Regenerate
              </button>
              <button onClick={() => setSuggestion(null)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        )}

        {/* Writing assistant */}
        <GlassCard className="overflow-hidden">
          <button className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/40 transition-colors"
            onClick={() => setShowAssistant(s => !s)}>
            <Bot className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-slate-700 flex-1 text-left">Writing Assistant</span>
            {showAssistant ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showAssistant && (
            <>
              <div className="max-h-40 overflow-y-auto p-3 space-y-2 border-t border-white/60">
                {assistantMsgs.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Ask for writing help, feedback, or ideas…</p>}
                {assistantMsgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "bg-purple-100 text-purple-800" : "bg-white/80 text-slate-700 border border-slate-100"}`}>{m.content}</div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex gap-2">
                    <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="px-3 py-2 rounded-xl bg-white/80 border border-slate-100">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/60">
                <input type="text" value={assistantInput} onChange={e => setAssistantInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askAssistant()} placeholder="Ask about your writing…"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
                <button onClick={askAssistant} disabled={!assistantInput.trim() || isAsking}
                  className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
