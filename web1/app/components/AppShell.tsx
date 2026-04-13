"use client";
import { ReactNode } from "react";
import InputBar from "./InputBar";
import VoiceBadge from "./VoiceBadge";

interface Props {
  children: ReactNode;
  hideInputBar?: boolean;
}

export default function AppShell({ children, hideInputBar = false }: Props) {

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" style={{ zIndex: 1 }}>
      <VoiceBadge />

      {/* Header */}
      <header className="flex items-center px-5 py-4 shrink-0">
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
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Input bar */}
      {!hideInputBar && <InputBar />}
    </div>
  );
}
