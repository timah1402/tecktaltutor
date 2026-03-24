"use client";
import { useState } from "react";
import {
  Database, Plus, CheckCircle2, Loader2, AlertCircle,
  Trash2, Star, FileText, Upload, X,
} from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type KBStatus = "ready" | "processing" | "error";

interface KB {
  id: string; name: string; provider: string; docs: number;
  chunks: number; status: KBStatus; isDefault: boolean;
}

const MOCK_KBS: KB[] = [
  { id: "1", name: "Physics Notes",      provider: "LlamaIndex", docs: 12, chunks: 340, status: "ready",      isDefault: true  },
  { id: "2", name: "History Essays",     provider: "LightRAG",   docs: 7,  chunks: 180, status: "ready",      isDefault: false },
  { id: "3", name: "Math Formulas",      provider: "LlamaIndex", docs: 24, chunks: 620, status: "processing", isDefault: false },
  { id: "4", name: "Biology Textbooks",  provider: "LlamaIndex", docs: 5,  chunks: 210, status: "error",      isDefault: false },
];

const STATUS_CONFIG = {
  ready:      { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100", label: "Ready" },
  processing: { icon: Loader2,      color: "text-amber-500",   bg: "bg-amber-100",   label: "Processing" },
  error:      { icon: AlertCircle,  color: "text-red-500",     bg: "bg-red-100",     label: "Error" },
};

export default function KnowledgePage() {
  const [kbs, setKbs] = useState<KB[]>(MOCK_KBS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [provider, setProvider] = useState("LlamaIndex");

  const handleCreate = () => {
    if (!newName.trim()) return;
    setKbs(prev => [...prev, { id: Date.now().toString(), name: newName, provider, docs: 0, chunks: 0, status: "ready", isDefault: false }]);
    setNewName(""); setShowCreate(false);
  };

  const setDefault = (id: string) => setKbs(prev => prev.map(kb => ({ ...kb, isDefault: kb.id === id })));
  const deleteKB   = (id: string) => setKbs(prev => prev.filter(kb => kb.id !== id));

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <Database className="w-7 h-7 text-indigo-600" />
              Knowledge Bases
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your RAG document collections</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">New Knowledge Base</p>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Knowledge base name…"
              className="w-full px-3 py-2.5 rounded-xl border border-white/80 bg-white/70 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400/30"
            />
            <div className="flex gap-2">
              {["LlamaIndex", "LightRAG"].map(p => (
                <button key={p} onClick={() => setProvider(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${provider === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Create</button>
            </div>
          </GlassCard>
        )}

        {/* KB Grid */}
        <div className="grid grid-cols-1 gap-3">
          {kbs.map(kb => {
            const sc = STATUS_CONFIG[kb.status];
            const StatusIcon = sc.icon;
            return (
              <GlassCard key={kb.id} glow="blue" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{kb.name}</p>
                        {kb.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">DEFAULT</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{kb.provider}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${sc.bg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${sc.color} ${kb.status === "processing" ? "animate-spin" : ""}`} />
                    <span className={`text-[11px] font-medium ${sc.color}`}>{sc.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{kb.docs} docs</span>
                  <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" />{kb.chunks} chunks</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" />Upload
                  </button>
                  {!kb.isDefault && (
                    <button onClick={() => setDefault(kb.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Star className="w-3.5 h-3.5" />Set Default
                    </button>
                  )}
                  <button onClick={() => deleteKB(kb.id)}
                    className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}

          {/* Add new card */}
          <GlassCard onClick={() => setShowCreate(true)} glow="blue"
            className="p-4 flex items-center justify-center gap-3 border-dashed cursor-pointer min-h-[72px]">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-sm text-slate-400 font-medium">Create Knowledge Base</span>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
