"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { ChevronRight } from "lucide-react";
import { useVoice } from "../providers/VoiceProvider";

export default function ResponseSheet() {
  const { aiResponse, lastQuery, isThinking, clearResponse, voiceStatus } = useVoice();
  const isOpen = isThinking || !!aiResponse || voiceStatus === "speaking";

  return (
    <>
      {/* Dim backdrop — tap to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(30,50,100,0.08)", backdropFilter: "blur(1px)" }}
          onClick={clearResponse}
        />
      )}

      {/* Right-side sheet */}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: "min(340px, 88vw)",
          background: "linear-gradient(180deg, rgba(248,251,255,0.98) 0%, rgba(240,247,255,0.98) 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderLeft: "1px solid rgba(200,220,255,0.5)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: isOpen ? "-20px 0 60px rgba(80,120,200,0.14)" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start gap-3 px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(200,220,255,0.35)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Answer
            </p>
            {lastQuery && (
              <p className="text-[12.5px] font-semibold text-slate-600 leading-snug line-clamp-2">
                &ldquo;{lastQuery}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={clearResponse}
            className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 transition-colors"
            aria-label="Close"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isThinking || (voiceStatus === "speaking" && !aiResponse) ? (
            /* Thinking skeleton */
            <div className="space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-typing-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">Thinking…</span>
              </div>
              {[70, 90, 55, 80].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded-full bg-slate-200/70 animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : aiResponse ? (
            <div className="prose-response animate-fade-in">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {aiResponse}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>

        {/* Speaking badge at bottom */}
        {voiceStatus === "speaking" && (
          <div
            className="mx-4 mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{
              background: "rgba(124,94,248,0.07)",
              border: "1px solid rgba(124,94,248,0.2)",
            }}
          >
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-[3px] rounded-full animate-bar-wave bar-${i + 1}`}
                  style={{
                    height: 14,
                    background: "linear-gradient(to top, #7c5ef8, #a78bfa)",
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-violet-600 font-medium">Speaking…</span>
          </div>
        )}
      </aside>
    </>
  );
}
