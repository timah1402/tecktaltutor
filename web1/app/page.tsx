"use client";

import { useRef, useState } from "react";
import {
  Keyboard, Mic, Paperclip, Send, X, FileText, Film,
  Home, History, BookOpen, PenTool, Calculator, Microscope,
  Edit3, Settings, Book, GraduationCap, Lightbulb, ChevronsLeft,
} from "lucide-react";

// ── Sidebar nav data (mirrors web/Sidebar.tsx) ──────────────────────────────
const NAV_GROUPS = [
  {
    name: "Workspace",
    items: [
      { name: "Home",             href: "/",          icon: Home },
      { name: "History",          href: "/history",   icon: History },
      { name: "Knowledge Bases",  href: "/knowledge", icon: BookOpen },
      { name: "Notebooks",        href: "/notebook",  icon: Book },
    ],
  },
  {
    name: "Learn & Research",
    items: [
      { name: "Question Generator", href: "/question", icon: PenTool },
      { name: "Smart Solver",       href: "/solver",   icon: Calculator },
      { name: "Guided Learning",    href: "/guide",    icon: GraduationCap },
      { name: "IdeaGen",            href: "/ideagen",  icon: Lightbulb },
      { name: "Deep Research",      href: "/research", icon: Microscope },
      { name: "Co-Writer",          href: "/co_writer",icon: Edit3 },
    ],
  },
];

// ── Attached-file type ───────────────────────────────────────────────────────
type AttachedFile = {
  file: File;
  preview: string | null;
  type: "image" | "video" | "file";
};

// ── Page ────────────────────────────────────────────────────────────────────
export default function EspeakPage() {
  const [isListening, setIsListening]   = useState(true);
  const [showInput,   setShowInput]     = useState(false);
  const [menuOpen,    setMenuOpen]      = useState(false);
  const [text,        setText]          = useState("");
  const [attachments, setAttachments]   = useState<AttachedFile[]>([]);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const textInputRef  = useRef<HTMLInputElement>(null);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleKeyboardToggle = () => {
    setShowInput((prev) => {
      if (!prev) setTimeout(() => textInputRef.current?.focus(), 50);
      return !prev;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped: AttachedFile[] = files.map((f) => {
      const isImage = f.type.startsWith("image/");
      const isVideo = f.type.startsWith("video/");
      return {
        file: f,
        preview: isImage ? URL.createObjectURL(f) : null,
        type: isImage ? "image" : isVideo ? "video" : "file",
      };
    });
    setAttachments((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => {
      const copy = [...prev];
      if (copy[i].preview) URL.revokeObjectURL(copy[i].preview!);
      copy.splice(i, 1);
      return copy;
    });
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    setText("");
    setAttachments([]);
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setShowInput(false);
  };

  // ── shared style ──────────────────────────────────────────────────────────
  const neumorphicBtn = {
    background: "linear-gradient(145deg, #e4ecf9, #d4e0f2)",
    boxShadow: "4px 4px 10px rgba(150,175,220,0.35), -3px -3px 8px rgba(255,255,255,0.8)",
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(160deg, #e8eef8 0%, #dce6f5 40%, #e4eaf6 100%)" }}
    >

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ─────────────────────────────────────────────────── */}
      <aside
        className="fixed top-0 right-0 h-full z-40 flex flex-col border-l border-slate-200 transition-transform duration-300 ease-in-out"
        style={{
          width: "256px",
          background: "rgba(248,250,255,0.92)",
          backdropFilter: "blur(18px)",
          transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: menuOpen ? "-8px 0 32px rgba(100,130,200,0.15)" : "none",
        }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6ba3f5, #4f8ef7)" }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M9 4v10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-[15px] tracking-tight">Tecktal Tutor</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded transition-colors"
            title="Close menu"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.name}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
                {group.name}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all duration-150 text-sm font-medium"
                  >
                    <item.icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 px-2 py-2">
          <a
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all duration-150 text-sm"
          >
            <Settings className="w-5 h-5 text-slate-400 flex-shrink-0" />
            Settings
          </a>
        </div>
      </aside>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6ba3f5 0%, #4f8ef7 100%)",
              boxShadow: "0 4px 12px rgba(79,142,247,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9h10M9 4v10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold text-slate-700 tracking-tight">Tecktal Tutor</span>
        </div>

        {/* Hamburger — opens drawer */}
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl bg-white/60 backdrop-blur-sm shadow-sm border border-white/80 transition-all"
          aria-label="Toggle menu"
        >
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "18px" }} />
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "18px" }} />
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "18px" }} />
        </button>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 gap-8">

        {/* Voice Visualizer */}
        <div className="relative flex items-center justify-center">
          <div
            className="ring-outer absolute rounded-full border border-blue-200/50"
            style={{ width: "260px", height: "260px", animation: "pulse_ring 3s ease-in-out infinite" }}
          />
          <div
            className="ring-mid absolute rounded-full border border-blue-300/40"
            style={{ width: "210px", height: "210px", animation: "pulse_ring 3s ease-in-out infinite", animationDelay: "0.4s" }}
          />
          <div
            className="relative z-10 rounded-full flex items-center justify-center"
            style={{
              width: "160px",
              height: "160px",
              background: "linear-gradient(145deg, #dce8fc, #c8d9f5)",
              boxShadow: "8px 8px 20px rgba(150,175,220,0.45), -6px -6px 16px rgba(255,255,255,0.85)",
            }}
          >
            <div className="flex items-center gap-[3px]" style={{ height: "44px" }}>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`bar rounded-full ${isListening ? "animate-bar" : ""}`}
                  style={{
                    width: "4px",
                    height: "100%",
                    background: "linear-gradient(to top, #4f8ef7, #8ab4fc)",
                    borderRadius: "2px",
                    animationDelay: `${[0, 0.15, 0.3, 0.05, 0.25, 0.1, 0.2][i]}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chat card */}
        <div
          className="w-full max-w-sm rounded-2xl px-5 py-4 animate-fade-in"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 8px 32px rgba(100,130,200,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
            border: "1px solid rgba(255,255,255,0.85)",
          }}
        >
          <div className="mb-2">
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path
                d="M0 16V10.667C0 7.11 1.07 4.222 3.21 2 5.35.667 7.72 0 10.24 0v2.667c-1.75 0-3.21.644-4.38 1.933C4.67 5.889 4.08 7.444 4.08 9.333H8V16H0zm11.2 0V10.667c0-3.556 1.07-6.444 3.21-8.667C16.55.667 18.92 0 21.44 0v2.667c-1.75 0-3.21.644-4.38 1.933-1.19 1.289-1.78 2.844-1.78 4.733H19.2V16H11.2z"
                fill="#CBD5E1"
              />
            </svg>
          </div>
          <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
            "Can you explain how integration by parts relates to the product rule in calculus?"
          </p>
          <div className="flex items-center gap-1.5 mt-3 ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dot w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ── Text input panel ───────────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: showInput ? "260px" : "0px" }}
      >
        <div className="px-5 pt-3 pb-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {att.type === "image" && att.preview ? (
                    <img src={att.preview} alt={att.file.name} className="w-14 h-14 object-cover rounded-xl border border-white/70 shadow" />
                  ) : att.type === "video" ? (
                    <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shadow">
                      <Film size={22} className="text-slate-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/70 shadow border border-white/80 max-w-[120px]">
                      <FileText size={14} className="text-blue-400 shrink-0" />
                      <span className="text-[11px] text-slate-600 truncate">{att.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: "18px", height: "18px" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 4px 20px rgba(100,130,200,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-blue-50 transition-colors"
              title="Attach file, image or video"
            >
              <Paperclip size={17} className="text-slate-400" />
            </button>

            <input
              ref={textInputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              className="flex-1 bg-transparent outline-none text-[14px] text-slate-700 placeholder:text-slate-400"
            />

            <button
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5fa0f8, #4080f0)" }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Footer / Controls ──────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center gap-3 pb-8 pt-3">
        <div className="flex items-center gap-6">

          <button
            onClick={handleKeyboardToggle}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
            style={showInput
              ? { background: "linear-gradient(135deg, #5fa0f8, #4080f0)", boxShadow: "0 4px 14px rgba(79,142,247,0.4)" }
              : neumorphicBtn}
            title="Type a message"
          >
            <Keyboard size={20} className={showInput ? "text-white" : "text-slate-400"} />
          </button>

          <button
            onClick={() => setIsListening((p) => !p)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "linear-gradient(135deg, #5fa0f8, #4080f0)",
              boxShadow: isListening
                ? "0 0 0 6px rgba(79,142,247,0.2), 0 6px 20px rgba(79,142,247,0.45)"
                : "0 4px 14px rgba(79,142,247,0.4)",
            }}
            title={isListening ? "Stop recording" : "Start recording"}
          >
            <Mic size={26} className="text-white" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all"
            style={neumorphicBtn}
            title="Upload file, image or video"
          >
            <Paperclip size={20} className="text-slate-400" />
            {attachments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </button>
        </div>

      </footer>
    </div>
  );
}
