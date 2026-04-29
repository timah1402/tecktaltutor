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

      {/* Content — no header, full height */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Input bar */}
      {!hideInputBar && <InputBar />}
    </div>
  );
}
