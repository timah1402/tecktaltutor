"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, CheckCircle2, Activity, DollarSign, Cpu, Trash2, Sparkles } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type Tab = "chat" | "logic";

interface Message { role: "user" | "assistant"; content: string; isStreaming?: boolean; }
interface LogEntry { type: "progress" | "tool" | "error" | "warning" | "step"; text: string; }

const QUICK_QUESTIONS = [
  "Solve ∫x·eˣ dx step by step",
  "Explain Newton's second law with an example",
  "What is the quadratic formula and when to use it?",
];

const MOCK_LOGS: LogEntry[] = [
  { type: "progress", text: "🔍 Round 1: Investigating the problem statement" },
  { type: "tool",     text: "📚 RAG search: calculus integration techniques" },
  { type: "step",     text: "Step 1: Identify u-substitution candidates" },
  { type: "progress", text: "🧮 Solving: Applying integration by parts" },
  { type: "tool",     text: "✅ Verification: Cross-checked with known results" },
  { type: "progress", text: "✍️ Composing final response" },
];

const MOCK_ANSWER = `To solve ∫x·eˣ dx, we use integration by parts.

**Formula:** ∫u dv = uv − ∫v du

**Step 1:** Choose u = x and dv = eˣ dx
**Step 2:** Then du = dx and v = eˣ
**Step 3:** Apply the formula:
  ∫x·eˣ dx = x·eˣ − ∫eˣ dx
**Step 4:** Integrate the remaining term:
  = x·eˣ − eˣ + C
**Result:** eˣ(x − 1) + C`;

export default function SolverPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSolving, setIsSolving] = useState(false);
  const [stage, setStage] = useState("");
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const STAGES = ["🔍 Investigating…", "🧮 Solving…", "✍️ Responding…"];

  const handleSend = async (q?: string) => {
    const question = q ?? input.trim();
    if (!question || isSolving) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setIsSolving(true);

    for (let i = 0; i < STAGES.length; i++) {
      setStage(STAGES[i]);
      await new Promise(r => setTimeout(r, 900));
    }

    // Use mock data — no API call
    setMessages(prev => [...prev, { role: "assistant", content: MOCK_ANSWER }]);
    setIsSolving(false);
    setStage("");
  };

  const logColors: Record<LogEntry["type"], string> = {
    progress: "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-400",
    tool:     "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-400",
    error:    "bg-red-50 text-red-700 border-l-2 border-red-400",
    warning:  "bg-amber-50 text-amber-700 border-l-2 border-amber-400",
    step:     "bg-blue-50 text-blue-700 border-l-2 border-blue-400",
  };

  return (
    <AppShell>
      <div className="flex flex-col px-4 pt-2 pb-4 max-w-lg mx-auto h-full animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              {isSolving && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Smart Solver
              </h1>
            </div>
          </div>
          <button onClick={() => { setMessages([]); setIsSolving(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl gap-1 mb-3 shrink-0" style={{ background: "rgba(255,255,255,0.5)" }}>
          {(["chat","logic"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize flex items-center justify-center gap-1.5 transition-all ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "chat" ? <><Bot className="w-3.5 h-3.5"/>Chat</> : <><Activity className="w-3.5 h-3.5"/>Logic Stream</>}
            </button>
          ))}
        </div>

        {tab === "chat" ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-8 gap-5">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">How can I help you today?</p>
                    <p className="text-sm text-slate-400 mt-1">Ask any math, science, or reasoning problem</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => handleSend(q)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 text-left hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 bg-white/70 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    {msg.role === "user" ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none text-slate-700 text-sm">
                          {msg.content}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md"
                          style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-white/80 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200/80 shadow-sm">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] text-slate-400">Verified by DeepTutor Logic Engine</span>
                            <button className="ml-auto flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600">
                              <Sparkles className="w-3 h-3"/>Add to Notebook
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}

              {isSolving && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="flex-1 bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"/>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"/>
                      </span>
                      {stage}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 pt-2">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl glass-bright">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={isSolving}
                  placeholder="Enter a problem to solve…"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400" />
                <button onClick={() => handleSend()} disabled={!input.trim() || isSolving}
                  className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">DeepTutor can make mistakes. Verify important results.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {/* Performance bar */}
            <GlassCard className="p-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-slate-400"/>gpt-4o-mini</span>
              <span className="text-slate-300">|</span>
              <span>3 calls</span>
              <span className="text-slate-300">|</span>
              <span>1.2k tokens</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-0.5 text-amber-500 font-medium"><DollarSign className="w-3 h-3"/>0.002</span>
              {isSolving && <span className="ml-auto flex items-center gap-1 text-indigo-500"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"/>Running</span>}
            </GlassCard>

            <div className="space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg text-xs ${logColors[log.type]}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
