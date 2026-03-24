"use client";
import {
  Home, History, BookOpen, Book, PenTool, Calculator,
  GraduationCap, Lightbulb, Microscope, Edit3, Settings,
  ChevronsRight, Mic,
} from "lucide-react";
import { useVoice } from "../providers/VoiceProvider";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { name: "Home", href: "/", icon: Home, cmd: "say 'home'" },
      { name: "History", href: "/history", icon: History, cmd: "say 'history'" },
      { name: "Knowledge Bases", href: "/knowledge", icon: BookOpen, cmd: "say 'knowledge'" },
      { name: "Notebooks", href: "/notebook", icon: Book, cmd: "say 'notebook'" },
    ],
  },
  {
    label: "Learn & Research",
    items: [
      { name: "Question Generator", href: "/question", icon: PenTool, cmd: "say 'questions'" },
      { name: "Smart Solver", href: "/solver", icon: Calculator, cmd: "say 'solver'" },
      { name: "Guided Learning", href: "/guide", icon: GraduationCap, cmd: "say 'learning'" },
      { name: "IdeaGen", href: "/ideagen", icon: Lightbulb, cmd: "say 'ideas'" },
      { name: "Deep Research", href: "/research", icon: Microscope, cmd: "say 'research'" },
      { name: "Co-Writer", href: "/co_writer", icon: Edit3, cmd: "say 'writer'" },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, isListening } = useVoice();
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(30,50,100,0.2)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: 272,
          background: "linear-gradient(180deg, rgba(248,251,255,0.97) 0%, rgba(240,247,255,0.97) 100%)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(200,220,255,0.5)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: sidebarOpen ? "-16px 0 48px rgba(80,120,200,0.15)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgba(200,220,255,0.3)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}
            >
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-slate-700 text-[15px]">Tecktal Tutor</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Voice hint */}
        <div
          className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2"
          style={{
            background: isListening ? "rgba(79,142,247,0.08)" : "rgba(100,120,180,0.05)",
            border: isListening ? "1px solid rgba(79,142,247,0.25)" : "1px solid rgba(200,215,240,0.4)",
          }}
        >
          <Mic className={`w-3.5 h-3.5 ${isListening ? "text-blue-500" : "text-slate-400"}`} />
          <span className="text-[11px] text-slate-500">Navigate by voice command</span>
          {isListening && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                        active
                          ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-800 border border-transparent"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}`} />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-[9px] text-slate-300 group-hover:text-slate-400 font-mono">{item.cmd}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(200,220,255,0.3)" }} className="px-2 py-2">
          <a
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white/70 hover:text-slate-700 transition-all duration-150 text-sm"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </a>
        </div>
      </aside>
    </>
  );
}
