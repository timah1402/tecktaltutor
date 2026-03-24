"use client";
import { useState } from "react";
import {
  History, Clock, ChevronRight, Calculator, FileText,
  Microscope, MessageCircle, Filter, Search, Calendar,
  X, MessageSquare,
} from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

const TYPE_CONFIG = {
  solve:    { icon: Calculator,    bgColor: "bg-blue-100",    textColor: "text-blue-600",    label: "SOLVE" },
  question: { icon: FileText,      bgColor: "bg-purple-100",  textColor: "text-purple-600",  label: "QUESTION" },
  research: { icon: Microscope,    bgColor: "bg-emerald-100", textColor: "text-emerald-600", label: "RESEARCH" },
  chat:     { icon: MessageCircle, bgColor: "bg-amber-100",   textColor: "text-amber-600",   label: "CHAT" },
};

const MOCK_ENTRIES = [
  { id: "1", type: "solve",    title: "Integration by parts in calculus", summary: "Solved ∫x·eˣ dx step-by-step using u-substitution.", date: "Today",     time: "2:30 PM" },
  { id: "2", type: "research", title: "Quantum entanglement overview",    summary: "Comprehensive report on Bell's theorem and non-locality.", date: "Today",     time: "11:00 AM" },
  { id: "3", type: "question", title: "World War II practice questions",  summary: "Generated 20 questions covering causes, battles, and aftermath.", date: "Yesterday", time: "4:15 PM" },
  { id: "4", type: "solve",    title: "Newton's laws of motion",          summary: "Applied F=ma to multi-body dynamics problems.", date: "Yesterday", time: "1:00 PM" },
  { id: "5", type: "research", title: "Climate change impacts 2024",      summary: "Deep research on global temperature trends.", date: "March 20",  time: "9:00 AM" },
];

const MOCK_CHAT_SESSIONS = [
  { id: "c1", title: "Discussion on photosynthesis", messages: 8,  last: "Can you explain the light reactions in more detail?", time: "Today" },
  { id: "c2", title: "Essay feedback session",        messages: 12, last: "The introduction needs a stronger thesis statement.",   time: "Yesterday" },
];

const MOCK_SOLVER_SESSIONS = [
  { id: "s1", title: "Quadratic equation solver", messages: 5, kb: "Math Notes",       cost: 0.002, time: "Today" },
  { id: "s2", title: "Physics momentum problems", messages: 7, kb: "Physics Textbook", cost: 0.003, time: "Yesterday" },
];

const FILTERS = ["all", "chat", "solve", "question", "research"];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredEntries = MOCK_ENTRIES.filter(e => {
    if (filter !== "all" && filter !== "chat" && e.type !== filter) return false;
    if (filter === "chat") return false;
    if (filter === "solve" && e.type !== "solve") return false;
    if (!search.trim()) return true;
    return e.title.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = filteredEntries.reduce<Record<string, typeof MOCK_ENTRIES>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const showChat = filter === "all" || filter === "chat";
  const showSolver = filter === "all" || filter === "solve";

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-blue-600" />
            History
          </h1>
          <p className="text-slate-500 text-sm mt-1">All Activities</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl glass-bright outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex p-1 rounded-xl gap-0.5" style={{ background: "rgba(255,255,255,0.5)" }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Activity entries */}
        {(filter === "all" || !["chat", "solve"].includes(filter)) && (
          <GlassCard className="overflow-hidden">
            {Object.keys(grouped).length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <History className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">No history found</p>
                <p className="text-xs text-slate-400 mt-1">Your activities will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/60">
                {Object.entries(grouped).map(([date, entries]) => (
                  <div key={date}>
                    <div className="px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-slate-500" style={{ background: "rgba(248,250,255,0.8)" }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {date}
                    </div>
                    {entries.map(entry => {
                      const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG];
                      const Icon = cfg.icon;
                      return (
                        <div key={entry.id} className="px-4 py-3.5 hover:bg-white/60 transition-colors cursor-pointer group">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl ${cfg.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-5 h-5 ${cfg.textColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.textColor}`}>{cfg.label}</span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                                  <Clock className="w-3 h-3" />{entry.time}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{entry.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{entry.summary}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Chat Sessions */}
        {showChat && MOCK_CHAT_SESSIONS.length > 0 && (
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/60">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-800">Chat History</h2>
              <span className="text-xs text-slate-400 ml-auto">{MOCK_CHAT_SESSIONS.length} sessions</span>
            </div>
            <div className="divide-y divide-white/60">
              {MOCK_CHAT_SESSIONS.map(s => (
                <div key={s.id} className="px-4 py-3.5 hover:bg-white/60 transition-colors cursor-pointer group">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">CHAT</span>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">{s.time}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{s.last}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">View</button>
                        <button className="px-3 py-1 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">Continue</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Solver Sessions */}
        {showSolver && MOCK_SOLVER_SESSIONS.length > 0 && (
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/60">
              <Calculator className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-800">Solver Sessions</h2>
              <span className="text-xs text-slate-400 ml-auto">{MOCK_SOLVER_SESSIONS.length} sessions</span>
            </div>
            <div className="divide-y divide-white/60">
              {MOCK_SOLVER_SESSIONS.map(s => (
                <div key={s.id} className="px-4 py-3.5 hover:bg-white/60 transition-colors cursor-pointer group">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">SOLVER</span>
                        <span className="text-[11px] text-amber-500 font-medium shrink-0 ml-2">${s.cost.toFixed(3)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">KB: {s.kb} · {s.messages} messages</p>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">View</button>
                        <button className="px-3 py-1 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">Continue</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
