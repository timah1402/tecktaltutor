"use client";
import { useState } from "react";
import { PenTool, Sparkles, Upload, ChevronDown, ChevronUp, Check, X, BookOpen } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type Mode = "custom" | "mimic";
type Difficulty = "Easy" | "Medium" | "Hard";
type QType = "MCQ" | "Written" | "Mixed";

interface Question {
  id: number;
  text: string;
  type: "mcq" | "written";
  options?: string[];
  answer?: number;
}

const SAMPLE_QUESTIONS: Question[] = [
  { id: 1, type: "mcq",     text: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], answer: 0 },
  { id: 2, type: "mcq",     text: "Which rule is used when differentiating a product of two functions?", options: ["Chain Rule", "Product Rule", "Quotient Rule", "Power Rule"], answer: 1 },
  { id: 3, type: "written", text: "Explain the relationship between integration by parts and the product rule." },
  { id: 4, type: "mcq",     text: "∫eˣ dx equals:", options: ["eˣ + C", "xeˣ + C", "eˣ/x + C", "e²ˣ + C"], answer: 0 },
  { id: 5, type: "written", text: "Describe the Fundamental Theorem of Calculus and its two parts." },
];

export default function QuestionPage() {
  const [mode, setMode] = useState<Mode>("custom");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [qtype, setQtype] = useState<QType>("Mixed");
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const handleGenerate = () => {
    if (!topic.trim() && mode === "custom") return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setQuestions(SAMPLE_QUESTIONS); }, 1800);
  };

  const score = Object.entries(submitted).filter(([id, done]) => {
    if (!done) return false;
    const q = questions.find(q => q.id === Number(id));
    return q?.type === "mcq" && userAnswers[Number(id)] === q.answer;
  }).length;

  const mcqDone = Object.keys(submitted).filter(id => questions.find(q => q.id === Number(id))?.type === "mcq").length;

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <PenTool className="w-7 h-7 text-purple-600" />
            Question Generator
          </h1>
          <p className="text-slate-500 text-sm mt-1">Auto-validated quizzes from any topic</p>
        </div>

        {/* Mode toggle */}
        <div className="flex p-1 rounded-xl gap-1" style={{ background: "rgba(255,255,255,0.5)" }}>
          {(["custom", "mimic"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {m === "custom" ? "Custom (Knowledge)" : "Mimic (Exam Paper)"}
            </button>
          ))}
        </div>

        {mode === "custom" ? (
          <GlassCard className="p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic or Subject</p>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Calculus derivatives, World War II…"
              className="w-full px-3 py-2.5 rounded-xl border border-white/80 bg-white/70 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-400/30" />

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">Difficulty</p>
                <div className="flex flex-col gap-1">
                  {(["Easy","Medium","Hard"] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${difficulty === d ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">Type</p>
                <div className="flex flex-col gap-1">
                  {(["MCQ","Written","Mixed"] as QType[]).map(t => (
                    <button key={t} onClick={() => setQtype(t)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${qtype === t ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">Count</p>
                <div className="flex flex-col gap-1">
                  {[5,10,20].map(n => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${count === n ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!topic.trim() || generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              {generating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Generating…</> : <><Sparkles className="w-4 h-4"/>Generate {count} Questions</>}
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="p-4">
            <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-purple-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">Drop exam PDF here</p>
              <p className="text-xs text-slate-400">or click to browse files</p>
              <button className="px-4 py-2 rounded-xl text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                Browse Files
              </button>
            </div>
            <button onClick={handleGenerate} disabled={generating}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              {generating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Generating…</> : <><Sparkles className="w-4 h-4"/>Generate from Exam Paper</>}
            </button>
          </GlassCard>
        )}

        {/* Score bar */}
        {questions.length > 0 && mcqDone > 0 && (
          <GlassCard className="px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(score / mcqDone) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-700">{score}/{mcqDone}</span>
          </GlassCard>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{questions.length} Questions Generated</p>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5"/>Save to Notebook
              </button>
            </div>
            {questions.map((q, i) => {
              const isOpen = expanded[q.id];
              const userAns = userAnswers[q.id];
              const isSubmitted = submitted[q.id];
              const isCorrect = isSubmitted && q.type === "mcq" && userAns === q.answer;
              const isWrong   = isSubmitted && q.type === "mcq" && userAns !== q.answer;
              return (
                <GlassCard key={q.id} glow={isCorrect ? "cyan" : "violet"} className="overflow-hidden">
                  <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => setExpanded(p => ({...p, [q.id]: !p[q.id]}))}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                      style={{ background: "rgba(139,92,246,0.12)", color: "#7c3aed" }}>{i + 1}</span>
                    <p className="flex-1 text-sm text-slate-700 leading-relaxed">{q.text}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.type === "mcq" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                        {q.type === "mcq" ? "MCQ" : "Written"}
                      </span>
                      {isCorrect && <Check className="w-4 h-4 text-emerald-500"/>}
                      {isWrong   && <X className="w-4 h-4 text-red-500"/>}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                    </div>
                  </div>
                  {isOpen && q.type === "mcq" && q.options && (
                    <div className="px-4 pb-4 space-y-2">
                      {q.options.map((opt, j) => {
                        const selected = userAns === j;
                        const correct  = isSubmitted && j === q.answer;
                        const wrong    = isSubmitted && selected && j !== q.answer;
                        return (
                          <button key={j} disabled={isSubmitted}
                            onClick={() => setUserAnswers(p => ({...p, [q.id]: j}))}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                              correct ? "bg-emerald-50 border border-emerald-300 text-emerald-700" :
                              wrong   ? "bg-red-50 border border-red-300 text-red-700" :
                              selected? "bg-purple-50 border border-purple-300 text-purple-700" :
                              "bg-slate-50 border border-transparent text-slate-600 hover:border-slate-200"
                            }`}>
                            <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold"
                              style={{ borderColor: correct ? "#10b981" : wrong ? "#ef4444" : selected ? "#7c3aed" : "#cbd5e1" }}>
                              {String.fromCharCode(65 + j)}
                            </span>
                            {opt}
                            {correct && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto"/>}
                            {wrong   && <X    className="w-3.5 h-3.5 text-red-500 ml-auto"/>}
                          </button>
                        );
                      })}
                      {!isSubmitted && userAns !== undefined && (
                        <button onClick={() => setSubmitted(p => ({...p, [q.id]: true}))}
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-white mt-1"
                          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                          Submit Answer
                        </button>
                      )}
                    </div>
                  )}
                  {isOpen && q.type === "written" && (
                    <div className="px-4 pb-4">
                      <textarea rows={3} placeholder="Write your answer here…"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none focus:ring-2 focus:ring-purple-400/30" />
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
