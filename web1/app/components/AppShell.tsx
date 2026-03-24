"use client";
import { ReactNode } from "react";
import { useVoice } from "../providers/VoiceProvider";
import Sidebar from "./Sidebar";
import InputBar from "./InputBar";
import VoiceBadge from "./VoiceBadge";

interface Props {
  children: ReactNode;
  hideInputBar?: boolean;
}

export default function AppShell({ children, hideInputBar = false }: Props) {
  const { setSidebarOpen } = useVoice();

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" style={{ zIndex: 1 }}>
      <VoiceBadge />
      <Sidebar />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)",
              boxShadow: "0 4px 14px rgba(79,142,247,0.35)",
            }}
          >
            <span className="text-white font-bold text-base">T</span>
          </div>
          <span className="text-[16px] font-semibold text-slate-700 tracking-tight">Tecktal Tutor</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 8px rgba(100,130,200,0.12)",
          }}
          aria-label="Open menu"
        >
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "17px" }} />
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "17px" }} />
          <span className="h-[1.5px] bg-slate-500 rounded-full" style={{ width: "11px" }} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Input bar */}
      {!hideInputBar && <InputBar />}
    </div>
  );
}
