"use client";
import { ReactNode, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  accentColor?: string;
  children: ReactNode;
}

export default function SlidePanel({
  isOpen,
  onClose,
  title,
  icon,
  accentColor = "#4f8ef7",
  children,
}: SlidePanelProps) {
  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,18,40,0.52)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 350ms ease-in-out",
        }}
      />

      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:w-[min(50vw,700px)]"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.99) 0%, rgba(246,249,255,0.99) 100%)",
          borderRadius: "22px 0 0 22px",
          boxShadow: [
            "-28px 0 72px rgba(10,18,40,0.18)",
            "-6px 0 20px rgba(10,18,40,0.07)",
            "inset 1px 0 0 rgba(200,220,255,0.55)",
          ].join(", "),
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 380ms cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Sticky Header ───────────────────────────────────────────────── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(200,220,255,0.55)",
            padding: "13px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            style={{
              padding: "5px 11px 5px 8px",
              borderRadius: 9,
              border: "1px solid rgba(200,220,255,0.8)",
              background: "rgba(248,250,255,0.95)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              letterSpacing: 0.2,
            }}
          >
            <ArrowLeft size={13} />
            Back
          </button>

          {/* Divider */}
          <span
            style={{
              width: 1,
              height: 20,
              background: "rgba(200,220,255,0.9)",
              flexShrink: 0,
            }}
          />

          {/* Icon */}
          {icon && (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: accentColor + "1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}

          {/* Title */}
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#0f172a",
              flex: 1,
              lineHeight: 1,
            }}
          >
            {title}
          </span>

          {/* Close X */}
          <button
            onClick={onClose}
            className="flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid rgba(200,220,255,0.6)",
              background: "rgba(248,250,255,0.9)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable Content ───────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(14px)",
            transition: isOpen
              ? "opacity 320ms ease 190ms, transform 320ms ease 190ms"
              : "none",
          }}
        >
          {/* Only mount children when open so stagger animations replay each time */}
          {isOpen && children}
        </div>
      </div>
    </div>
  );
}
