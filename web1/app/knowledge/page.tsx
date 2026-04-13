"use client";
import { useState, useCallback, useRef } from "react";
import {
  Database, Plus, CheckCircle2, Loader2, AlertCircle,
  Trash2, Star, FileText, Upload, X, RefreshCw,
  Layers, Search, BookOpen,
  FolderOpen,
} from "lucide-react";
import AppShell from "../components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type KBStatus = "ready" | "processing" | "error";
type RagProvider = "LlamaIndex" | "LightRAG" | "RAGAnything";

interface KB {
  id: string;
  name: string;
  provider: RagProvider;
  docs: number;
  images: number;
  chunks: number;
  status: KBStatus;
  isDefault: boolean;
  progress?: number; // 0–100 while processing
}

interface UploadFile {
  id: string;
  file: File;
  ext: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KBStatus, { icon: any; color: string; bg: string; bar: string; label: string }> = {
  ready:      { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50",  bar: "bg-emerald-500", label: "Ready" },
  processing: { icon: Loader2,      color: "text-blue-600",    bg: "bg-blue-50",     bar: "bg-blue-500",    label: "Processing" },
  error:      { icon: AlertCircle,  color: "text-red-500",     bg: "bg-red-50",      bar: "bg-red-400",     label: "Error" },
};

const PROVIDER_COLORS: Record<RagProvider, { text: string; bg: string; border: string }> = {
  LlamaIndex:   { text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" },
  LightRAG:     { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  RAGAnything:  { text: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200" },
};

const MOCK_KBS: KB[] = [
  { id: "1", name: "Physics Notes",     provider: "LlamaIndex",  docs: 12, images: 3,  chunks: 340, status: "ready",      isDefault: true,  progress: 100 },
  { id: "2", name: "History Essays",    provider: "LightRAG",    docs: 7,  images: 0,  chunks: 180, status: "ready",      isDefault: false, progress: 100 },
  { id: "3", name: "Math Formulas",     provider: "LlamaIndex",  docs: 24, images: 8,  chunks: 620, status: "processing", isDefault: false, progress: 62 },
  { id: "4", name: "Biology Textbooks", provider: "RAGAnything", docs: 5,  images: 14, chunks: 210, status: "error",      isDefault: false, progress: 40 },
];

const PROVIDERS: RagProvider[] = ["LlamaIndex", "LightRAG", "RAGAnything"];

const SUPPORTED_EXTS = ["pdf", "txt", "md", "docx", "json", "csv", "html", "png", "jpg", "jpeg"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const fmtSize = (b: number) => {
  if (b === 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
};

const FileIcon = ({ ext }: { ext: string }) => {
  const color =
    ext === "pdf" ? "text-red-500" :
    ext === "md"  ? "text-blue-500" :
    ["doc", "docx"].includes(ext) ? "text-blue-600" :
    ["png", "jpg", "jpeg", "gif"].includes(ext) ? "text-pink-500" :
    ["csv", "xlsx"].includes(ext) ? "text-green-600" :
    "text-slate-400";
  return <FileText className={`w-4 h-4 ${color}`} />;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgePage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [kbs, setKbs]                 = useState<KB[]>(MOCK_KBS);
  const [search, setSearch]           = useState("");
  const [showCreate, setShowCreate]   = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [targetKb, setTargetKb]       = useState("");
  const [newName, setNewName]         = useState("");
  const [provider, setProvider]       = useState<RagProvider>("LlamaIndex");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const filtered = kbs.filter(kb =>
    !search.trim() || kb.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── File handling ──────────────────────────────────────────────────────────

  const addFiles = (files: File[]) => {
    setUploadFiles(prev => {
      const existing = new Set(prev.map(f => f.file.name));
      const fresh = files
        .filter(f => !existing.has(f.name) && SUPPORTED_EXTS.includes(getExt(f.name)))
        .map(f => ({ id: Math.random().toString(36).slice(2), file: f, ext: getExt(f.name) }));
      return [...prev, ...fresh];
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    if (!newName.trim() || uploadFiles.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      setKbs(prev => [...prev, {
        id: Date.now().toString(), name: newName, provider,
        docs: uploadFiles.length, images: 0, chunks: 0,
        status: "processing", isDefault: false, progress: 0,
      }]);
      setNewName(""); setUploadFiles([]); setShowCreate(false); setUploading(false);
    }, 800);
  };

  const handleUpload = () => {
    if (!targetKb || uploadFiles.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      setKbs(prev => prev.map(kb =>
        kb.id === targetKb
          ? { ...kb, docs: kb.docs + uploadFiles.length, status: "processing", progress: 0 }
          : kb
      ));
      setUploadFiles([]); setShowUpload(false); setUploading(false);
    }, 800);
  };

  const setDefault  = (id: string) => setKbs(prev => prev.map(kb => ({ ...kb, isDefault: kb.id === id })));
  const deleteKB    = (id: string) => setKbs(prev => prev.filter(kb => kb.id !== id));
  const openUpload  = (kb: KB)     => { setTargetKb(kb.id); setUploadFiles([]); setShowUpload(true); };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const _inner = (
    <>
      <div className="flex flex-col h-full">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div
          className="shrink-0 px-5 pt-2 pb-3 space-y-3"
          style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Knowledge Bases</h1>
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
            >
              {filtered.length} bases
            </span>
          </div>

          <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search knowledge bases…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300/40"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(200,220,255,0.6)",
                }}
              />
            </div>
            {/* Refresh */}
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(200,220,255,0.6)" }}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
            {/* New KB */}
            <button
              onClick={() => { setUploadFiles([]); setNewName(""); setProvider("LlamaIndex"); setShowCreate(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow: "0 3px 12px rgba(79,142,247,0.35)" }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {/* ── KB Grid ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                <Database className="w-7 h-7" style={{ color: "rgba(99,102,241,0.4)" }} />
              </div>
              <p className="text-sm font-semibold text-slate-500">No knowledge bases found</p>
              <p className="text-xs text-slate-400">Create your first one to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(kb => {
                const sc = STATUS_CONFIG[kb.status];
                const pc = PROVIDER_COLORS[kb.provider];
                const StatusIcon = sc.icon;
                const barWidth = kb.status === "ready" ? 100 : kb.progress ?? 0;
                return (
                  <div
                    key={kb.id}
                    className="rounded-2xl flex flex-col transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(200,220,255,0.55)",
                      boxShadow: "0 2px 12px rgba(100,130,200,0.08)",
                    }}
                  >
                    {/* Top section */}
                    <div className="px-3 pt-3 pb-2.5">
                      {/* Icon + action row */}
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(99,102,241,0.1)" }}
                        >
                          <Database className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <div className="flex gap-0.5">
                          {!kb.isDefault && (
                            <button onClick={() => setDefault(kb.id)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => openUpload(kb)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Upload className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteKB(kb.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Name */}
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">{kb.name}</p>

                      {/* Provider + default badges */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pc.bg} ${pc.text}`}>{kb.provider}</span>
                        {kb.isDefault && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: "rgba(79,142,247,0.1)", color: "#3b82f6" }}>
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 mx-3 mb-2.5 rounded-xl overflow-hidden"
                      style={{ background: "rgba(248,250,255,0.8)", border: "1px solid rgba(200,215,240,0.4)" }}>
                      <div className="flex flex-col items-center py-2" style={{ borderRight: "1px solid rgba(200,215,240,0.4)" }}>
                        <span className="text-base font-bold text-slate-700">{kb.docs}</span>
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                          <FileText className="w-2.5 h-2.5" /> Docs
                        </span>
                      </div>
                      <div className="flex flex-col items-center py-2">
                        <span className="text-base font-bold text-slate-700">{kb.chunks}</span>
                        <span className="text-[9px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5">
                          <Layers className="w-2.5 h-2.5" /> Chunks
                        </span>
                      </div>
                    </div>

                    {/* Status + progress bar */}
                    <div className="px-3 pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className={`flex items-center gap-1 text-[10px] font-semibold ${sc.color}`}>
                          <StatusIcon className={`w-3 h-3 ${kb.status === "processing" ? "animate-spin" : ""}`} />
                          {sc.label}
                          {kb.status === "processing" && kb.progress !== undefined && (
                            <span className="text-slate-400 font-normal">{kb.progress}%</span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(200,215,240,0.35)" }}>
                        <div className={`h-full rounded-full transition-all duration-500 ${sc.bar}`} style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add new card */}
              <button
                onClick={() => { setUploadFiles([]); setNewName(""); setProvider("LlamaIndex"); setShowCreate(true); }}
                className="rounded-2xl flex flex-col items-center justify-center gap-2 py-6 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1.5px dashed rgba(150,170,220,0.45)",
                  minHeight: "130px",
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.09)" }}>
                  <Plus className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-slate-400">New Knowledge Base</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create KB modal ────────────────────────────────────── */}
      {showCreate && (
        <BottomSheet title="New Knowledge Base" onClose={() => setShowCreate(false)}>
          <div className="space-y-2.5">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Knowledge base name…"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300/40"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,220,255,0.7)" }}
            />

            {/* Provider selector */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">RAG Provider</p>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(p => {
                  const pc = PROVIDER_COLORS[p];
                  const active = provider === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all border ${active ? `${pc.bg} ${pc.text} ${pc.border}` : "bg-slate-50 text-slate-500 border-slate-200"}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drop zone */}
            <DropZone
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileInput={e => addFiles(Array.from(e.target.files ?? []))}
              fileInputRef={fileInputRef}
            />

            {/* File list */}
            {uploadFiles.length > 0 && <FileList files={uploadFiles} onRemove={id => setUploadFiles(p => p.filter(f => f.id !== id))} />}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600 transition-all" style={{ background: "rgba(100,120,180,0.08)", border: "1px solid rgba(150,170,210,0.25)" }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || uploadFiles.length === 0 || uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow: "0 3px 12px rgba(79,142,247,0.3)" }}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ── Upload to existing KB modal ───────────────────────── */}
      {showUpload && (
        <BottomSheet title={`Upload to "${kbs.find(k => k.id === targetKb)?.name}"`} onClose={() => setShowUpload(false)}>
          <div className="space-y-3">
            <DropZone
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileInput={e => addFiles(Array.from(e.target.files ?? []))}
              fileInputRef={fileInputRef}
            />
            {uploadFiles.length > 0 && <FileList files={uploadFiles} onRemove={id => setUploadFiles(p => p.filter(f => f.id !== id))} />}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-600" style={{ background: "rgba(100,120,180,0.08)", border: "1px solid rgba(150,170,210,0.25)" }}>
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#4f8ef7,#7c5ef8)", boxShadow: "0 3px 12px rgba(79,142,247,0.3)" }}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_EXTS.map(e => `.${e}`).join(",")}
        className="hidden"
        onChange={e => addFiles(Array.from(e.target.files ?? []))}
      />
    </>
  );
  if (isEmbedded) return _inner;
  return <AppShell>{_inner}</AppShell>;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(15,25,60,0.45)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col rounded-2xl animate-fade-up"
        style={{
          maxWidth: "340px",
          maxHeight: "80vh",
          background: "linear-gradient(180deg,rgba(248,251,255,0.99) 0%,rgba(240,247,255,0.99) 100%)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 8px 48px rgba(80,120,200,0.25)",
          border: "1px solid rgba(200,220,255,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(200,220,255,0.4)" }}>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function DropZone({
  dragActive, onDrag, onDrop, onFileInput, fileInputRef,
}: {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className="w-full rounded-2xl flex flex-col items-center justify-center gap-1.5 py-5 cursor-pointer transition-all duration-200"
      style={{
        border: dragActive ? "2px dashed #4f8ef7" : "2px dashed rgba(150,170,220,0.4)",
        background: dragActive ? "rgba(79,142,247,0.05)" : "rgba(248,250,255,0.6)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: dragActive ? "rgba(79,142,247,0.12)" : "rgba(99,102,241,0.08)" }}
      >
        <FolderOpen className={`w-4.5 h-4.5 ${dragActive ? "text-blue-500" : "text-indigo-400"}`} />
      </div>
      <p className="text-sm font-medium text-slate-600">
        {dragActive ? "Drop files here" : "Drag & drop or tap to browse"}
      </p>
      <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, MD, JSON, CSV, HTML, images</p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept={SUPPORTED_EXTS.map(e => `.${e}`).join(",")}
        onChange={onFileInput}
      />
    </div>
  );
}

function FileList({ files, onRemove }: { files: UploadFile[]; onRemove: (id: string) => void }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,220,255,0.5)" }}>
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: "rgba(248,250,255,0.8)", borderBottom: "1px solid rgba(200,220,255,0.4)" }}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{files.length} file{files.length !== 1 ? "s" : ""} selected</span>
      </div>
      <div className="divide-y divide-white/60 max-h-40 overflow-y-auto">
        {files.map(f => (
          <div key={f.id} className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: "rgba(255,255,255,0.7)" }}>
            <FileIcon ext={f.ext} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 font-medium truncate">{f.file.name}</p>
              <p className="text-[10px] text-slate-400">{fmtSize(f.file.size)}</p>
            </div>
            <button onClick={() => onRemove(f.id)} className="text-slate-300 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
