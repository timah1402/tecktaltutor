"use client";
import { useRef, useState } from "react";
import { Keyboard, Mic, Paperclip, Send, X, FileText, Film, MicOff } from "lucide-react";
import { useVoice } from "../providers/VoiceProvider";

type AttachedFile = {
  file: File;
  preview: string | null;
  type: "image" | "video" | "file";
};

export default function InputBar() {
  const { showInput, setShowInput, toggleListening, isListening, voiceStatus } = useVoice();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const isThinking = voiceStatus === "thinking";

  const handleKeyboard = () => {
    setShowInput(!showInput);
    if (!showInput) setTimeout(() => textRef.current?.focus(), 60);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        type: f.type.startsWith("image/")
          ? ("image" as const)
          : f.type.startsWith("video/")
          ? ("video" as const)
          : ("file" as const),
      })),
    ]);
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

  const neumorph = {
    background: "linear-gradient(145deg, #e4ecf9, #d4e0f2)",
    boxShadow: "4px 4px 10px rgba(150,175,220,0.35), -3px -3px 8px rgba(255,255,255,0.8)",
  };

  return (
    <div className="relative z-10">
      {/* Text input panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: showInput ? "240px" : "0" }}
      >
        <div className="px-4 pt-3 pb-2">
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {att.type === "image" && att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      className="w-14 h-14 object-cover rounded-xl border border-white/80 shadow-sm"
                    />
                  ) : att.type === "video" ? (
                    <div className="w-14 h-14 rounded-xl glass flex items-center justify-center">
                      <Film size={20} className="text-slate-400" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass max-w-[120px]">
                      <FileText size={13} className="text-blue-400 shrink-0" />
                      <span className="text-[11px] text-slate-600 truncate">{att.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-slate-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
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
            >
              <Paperclip size={16} className="text-slate-400" />
            </button>
            <input
              ref={textRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                if (e.key === "Escape") setShowInput(false);
              }}
              placeholder="Type your message…"
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg, #4f8ef7, #6366f1)" }}
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-center gap-5 py-5 pb-8">
        {/* Keyboard toggle */}
        <button
          onClick={handleKeyboard}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
          style={
            showInput
              ? { background: "linear-gradient(135deg, #4f8ef7, #6366f1)", boxShadow: "0 4px 16px rgba(79,142,247,0.4)" }
              : neumorph
          }
          title="Type a message"
        >
          <Keyboard size={20} className={showInput ? "text-white" : "text-slate-400"} />
        </button>

        {/* Mic button */}
        <button
          onClick={toggleListening}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #4f8ef7, #6366f1)",
            boxShadow: isListening
              ? "0 0 0 6px rgba(79,142,247,0.2), 0 0 0 12px rgba(79,142,247,0.08), 0 6px 20px rgba(79,142,247,0.45)"
              : "0 4px 16px rgba(79,142,247,0.4)",
          }}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening || isThinking ? (
            <MicOff size={26} className="text-white" />
          ) : (
            <Mic size={26} className="text-white" />
          )}
        </button>

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center relative transition-all duration-200"
          style={neumorph}
          title="Upload file"
        >
          <Paperclip size={20} className="text-slate-400" />
          {attachments.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
              {attachments.length}
            </span>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
