"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Edit3, Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Quote, Code, Minus, Table, Download, FileText, Sparkles,
  Eye, EyeOff, Bot, Send, Loader2, Check, RefreshCw, X,
  ChevronRight, ChevronLeft, Save, Wand2, Strikethrough,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import AppShell from "../components/AppShell";
import { usePageAction } from "../providers/NavigationProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssistantMsg { role: "user" | "assistant"; content: string; }
interface Suggestion { text: string; action: "continue" | "rewrite" | "expand" | "shorten"; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_CONTENT = `# The Impact of Artificial Intelligence on Modern Education

Artificial intelligence is fundamentally transforming traditional pedagogical approaches, creating personalized learning experiences that adapt to individual student needs and learning styles.

## Key Areas of Impact

### 1. Personalized Learning Pathways

AI systems analyze student performance data in real-time to identify knowledge gaps and adapt content delivery. The effectiveness can be modeled as:

$$E_{\\text{learning}} = \\frac{\\sum_{i=1}^{n} w_i \\cdot s_i}{n}$$

where $w_i$ represents the weight of each competency and $s_i$ is the student's score on that dimension.

### 2. Intelligent Tutoring Systems

Modern AI tutors provide immediate, context-aware feedback. Unlike static content, they can:

- Explain concepts in **multiple modalities** (visual, textual, interactive)
- Adjust difficulty based on the student's **zone of proximal development**
- Track long-term retention using spaced repetition algorithms

### 3. Assessment and Analytics

| Assessment Type | Traditional | AI-Enhanced |
|---|---|---|
| Feedback latency | Days–weeks | Immediate |
| Personalization | None | High |
| Bias detection | Manual | Automated |
| Scalability | Limited | Unlimited |

## Challenges and Ethical Considerations

The widespread adoption of AI in education raises important questions about **academic integrity**, algorithmic bias, and the evolving role of human educators.`;

const CONTINUATIONS = [
  "\n\n### 4. Adaptive Assessment Design\n\nBeyond tutoring, AI enables dynamic assessment generation — problems are tailored to the student's current mastery level, ensuring neither frustration nor boredom. The optimal difficulty follows the **flow theory** curve: $D^* = f(\\text{skill level})$.",
  "\n\n### 4. Natural Language Processing in Education\n\nLarge language models now power essay grading systems capable of evaluating **argument coherence**, **citation quality**, and **writing style** at scale — a task previously requiring expert human evaluators.",
  "\n\n### 4. Emotional Intelligence and Engagement\n\nNext-generation AI tutors incorporate affective computing, detecting signs of confusion or disengagement through webcam analysis and adjusting pacing accordingly. Studies show a **23% improvement** in session completion rates.",
];

const REWRITES: Record<string, string[]> = {
  default: [
    "AI is revolutionizing education by delivering hyper-personalized learning experiences that dynamically adapt to each student's unique cognitive profile and learning pace.",
    "The integration of artificial intelligence into educational frameworks marks a paradigm shift, enabling data-driven, adaptive instruction that transcends traditional one-size-fits-all approaches.",
  ],
};

const MOCK_RESPONSES: Record<string, string> = {
  default: "Great question! Here's a suggestion:\n\nYou could strengthen this section by adding a concrete example — for instance, how **Khan Academy's AI** adjusts problem difficulty in real-time based on response patterns. This grounds the abstract claim in a recognizable product.",
  improve: "To improve the flow here, consider:\n\n1. **Transition sentence** before the bullet list to contextualize the items\n2. **Active voice** — e.g., *'AI systems adapt content'* rather than *'content is adapted'*\n3. Add a **concluding sentence** that ties back to the main thesis",
  shorter: "Here's a condensed version:\n\n*AI tutors provide immediate, context-aware feedback, adjusting difficulty and modality to match each student's zone of proximal development.*",
};

// ─── Toolbar config ───────────────────────────────────────────────────────────

const TOOLBAR_GROUPS = [
  [
    { icon: Bold, label: "Bold", wrap: ["**", "**"] },
    { icon: Italic, label: "Italic", wrap: ["*", "*"] },
    { icon: Strikethrough, label: "Strikethrough", wrap: ["~~", "~~"] },
    { icon: Code, label: "Inline Code", wrap: ["`", "`"] },
  ],
  [
    { icon: Heading1, label: "Heading 1", prefix: "# " },
    { icon: Heading2, label: "Heading 2", prefix: "## " },
    { icon: List, label: "Bullet List", prefix: "- " },
    { icon: ListOrdered, label: "Numbered List", prefix: "1. " },
    { icon: Quote, label: "Quote", prefix: "> " },
  ],
  [
    { icon: Minus, label: "Divider", insert: "\n\n---\n\n" },
    { icon: Table, label: "Table", insert: "\n\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Cell | Cell | Cell |\n\n" },
  ],
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoWriterPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [content, setContent] = useState(INIT_CONTENT);
  const [saved, setSaved] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggLoading, setSuggLoading] = useState(false);
  const [suggIdx, setSuggIdx] = useState(0);
  const [rightOpen, setRightOpen] = useState(true);
  const [assistantMsgs, setAssistantMsgs] = useState<AssistantMsg[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Selection-based popover
  const [popover, setPopover] = useState<{ x: number; y: number; text: string; start: number; end: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMsgs]);

  // ── Toolbar actions ─────────────────────────────────────────────────────────

  const applyWrap = useCallback((before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e) || "text";
    const newVal = value.slice(0, s) + before + selected + after + value.slice(e);
    setContent(newVal);
    setSaved(false);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + selected.length); }, 0);
  }, []);

  const applyPrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { value, selectionStart } = ta;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    setContent(newVal);
    setSaved(false);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length); }, 0);
  }, []);

  const applyInsert = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, value } = ta;
    const newVal = value.slice(0, s) + text + value.slice(s);
    setContent(newVal);
    setSaved(false);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length); }, 0);
  }, []);

  const handleToolbar = (btn: typeof TOOLBAR_GROUPS[0][0]) => {
    if ("wrap" in btn) applyWrap(btn.wrap[0], btn.wrap[1]);
    if ("prefix" in btn) applyPrefix(btn.prefix);
    if ("insert" in btn) applyInsert(btn.insert);
  };

  // ── Selection popover ───────────────────────────────────────────────────────

  const handleSelectionChange = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    if (e <= s + 10) { setPopover(null); return; }
    const rect = ta.getBoundingClientRect();
    setPopover({ x: rect.left + 12, y: rect.top - 44, text: value.slice(s, e), start: s, end: e });
  };

  const applyAI = async (action: "rewrite" | "expand" | "shorten") => {
    if (!popover || isProcessing) return;
    setIsProcessing(true);
    setPopover(null);
    await new Promise(r => setTimeout(r, 900));
    const replacements = REWRITES.default;
    const replacement = replacements[Math.floor(Math.random() * replacements.length)];
    const newContent = content.slice(0, popover.start) + replacement + content.slice(popover.end);
    setContent(newContent);
    setSaved(false);
    setIsProcessing(false);
  };

  // ── AI Suggestion ───────────────────────────────────────────────────────────

  const aiSuggest = async () => {
    setSuggLoading(true);
    setSuggestion(null);
    await new Promise(r => setTimeout(r, 1100));
    setSuggestion({ text: CONTINUATIONS[suggIdx % CONTINUATIONS.length], action: "continue" });
    setSuggIdx(i => i + 1);
    setSuggLoading(false);
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setContent(p => p + suggestion.text);
    setSuggestion(null);
    setSaved(false);
  };

  const regenSuggestion = async () => {
    setSuggLoading(true);
    setSuggestion(null);
    await new Promise(r => setTimeout(r, 700));
    setSuggestion({ text: CONTINUATIONS[(suggIdx + 1) % CONTINUATIONS.length], action: "continue" });
    setSuggIdx(i => i + 1);
    setSuggLoading(false);
  };

  // ── Writing assistant ───────────────────────────────────────────────────────

  const askAssistant = async () => {
    const q = assistantInput.trim();
    if (!q || isAsking) return;
    setAssistantInput("");
    setAssistantMsgs(p => [...p, { role: "user", content: q }]);
    setIsAsking(true);
    await new Promise(r => setTimeout(r, 1100));
    const ql = q.toLowerCase();
    const reply = ql.includes("shorter") || ql.includes("condense")
      ? MOCK_RESPONSES.shorter
      : ql.includes("improve") || ql.includes("flow") || ql.includes("better")
        ? MOCK_RESPONSES.improve
        : MOCK_RESPONSES.default;
    setAssistantMsgs(p => [...p, { role: "assistant", content: reply }]);
    setIsAsking(false);
  };

  // ── Agent-driven writing start via SSE page_action ─────────────────────────
  usePageAction("co_writer", (evt) => {
    if (evt.action === "write" && evt.data.topic) {
      const agentTopic = evt.data.topic as string;
      const contentType = (evt.data.content_type as string) || "document";
      // Build a starter document scaffold
      const typeLabel = contentType === "essay" ? "Essay" :
        contentType === "report" ? "Report" :
          contentType === "summary" ? "Summary" :
            contentType === "notes" ? "Notes" :
              contentType === "explanation" ? "Explanation" : "Document";
      const scaffold = `# ${agentTopic}\n\n*${typeLabel} — started by TecktalTutor*\n\n## Introduction\n\n`;
      setContent(scaffold);
      setSaved(false);
      setRightOpen(true);
      // Prime the writing assistant with the topic
      setAssistantMsgs([{
        role: "assistant",
        content: `I've set up a **${typeLabel}** on "${agentTopic}". Start writing and I'll help you continue, improve, or restructure any section. You can also use **AI Continue** in the toolbar for suggestions.`,
      }]);
    }
  });

  // ── Export ──────────────────────────────────────────────────────────────────

  const exportMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "document.md" });
    a.click();
  };

  const _inner = (
    <div className="flex flex-col h-full overflow-hidden animate-fade-up">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2 shrink-0 border-b border-white/20 flex-wrap"
        style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(8px)" }}>

        {/* Formatting groups */}
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.map(btn => (
              <button key={btn.label} onClick={() => handleToolbar(btn)} title={btn.label}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
                <btn.icon className="w-3.5 h-3.5" />
              </button>
            ))}
            {gi < TOOLBAR_GROUPS.length - 1 && <div className="w-px h-5 bg-slate-200 mx-1" />}
          </div>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* AI Suggest */}
        <button onClick={aiSuggest} disabled={suggLoading || isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
          {suggLoading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Thinking…</>
            : <><Sparkles className="w-3.5 h-3.5" />AI Continue</>}
        </button>

        {isProcessing && (
          <span className="flex items-center gap-1.5 text-xs text-purple-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />Processing…
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Preview toggle */}
          <button onClick={() => setShowPreview(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${showPreview ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"}`}>
            {showPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Preview
          </button>
          {/* Export */}
          <button onClick={exportMd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
            <Download className="w-3.5 h-3.5" />MD
          </button>
          {/* Save status */}
          {saved
            ? <span className="flex items-center gap-1 text-[11px] text-emerald-500"><Check className="w-3 h-3" />Saved</span>
            : <button onClick={() => setSaved(true)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              <Save className="w-3 h-3" />Save
            </button>}
          <span className="text-[11px] text-slate-400">{wordCount} words</span>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Editor + preview */}
        <div className="flex flex-1 overflow-hidden min-w-0 relative">

          {/* Editor pane */}
          <div className={`flex flex-col overflow-hidden transition-all ${showPreview ? "w-1/2 border-r border-white/20" : "flex-1"}`}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 border-b border-white/20"
              style={{ background: "rgba(255,255,255,0.3)" }}>
              Markdown Editor
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => { setContent(e.target.value); setSaved(false); }}
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              className="flex-1 w-full resize-none outline-none text-sm text-slate-700 leading-relaxed font-mono p-5 bg-transparent placeholder:text-slate-400"
              placeholder="Start writing in Markdown…"
              spellCheck={false}
            />
          </div>

          {/* Preview pane */}
          {showPreview && (
            <div className="w-1/2 flex flex-col overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 border-b border-white/20"
                style={{ background: "rgba(255,255,255,0.3)" }}>
                Preview
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="prose-response">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Selection popover */}
          {popover && (
            <div className="fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl border border-white/80"
              style={{
                left: popover.x, top: popover.y,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(12px)",
              }}>
              <span className="text-[10px] text-slate-400 mr-1">AI:</span>
              {[
                { label: "Rewrite", action: "rewrite" as const, color: "text-purple-600 hover:bg-purple-50" },
                { label: "Expand", action: "expand" as const, color: "text-blue-600 hover:bg-blue-50" },
                { label: "Shorten", action: "shorten" as const, color: "text-emerald-600 hover:bg-emerald-50" },
              ].map(({ label, action, color }) => (
                <button key={action} onClick={() => applyAI(action)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${color}`}>
                  {label}
                </button>
              ))}
              <button onClick={() => setPopover(null)}
                className="ml-1 p-0.5 hover:bg-slate-100 rounded transition-colors text-slate-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel: Writing Assistant ─────────────────────────────── */}
        <div
          className="flex flex-col shrink-0 overflow-hidden transition-all duration-300 border-l border-white/20"
          style={{
            width: rightOpen ? "300px" : "40px",
            background: "rgba(255,255,255,0.38)",
            backdropFilter: "blur(10px)",
          }}
        >
          {rightOpen ? (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 shrink-0">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />Writing Assistant
                </span>
                <button onClick={() => setRightOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* AI Suggestion card */}
              {(suggestion || suggLoading) && (
                <div className="mx-3 mt-3 rounded-xl border border-purple-200/80 shrink-0 overflow-hidden"
                  style={{ background: "rgba(245,243,255,0.85)" }}>
                  <div className="px-3 py-2 flex items-center gap-1.5 border-b border-purple-100">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[11px] font-semibold text-purple-600">AI Suggestion</span>
                  </div>
                  {suggLoading ? (
                    <div className="px-3 py-3 flex items-center gap-2 text-xs text-purple-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…
                    </div>
                  ) : suggestion ? (
                    <>
                      <p className="px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed line-clamp-4 italic">
                        "{suggestion.text.trim().slice(0, 180)}…"
                      </p>
                      <div className="flex gap-1.5 px-3 pb-3">
                        <button onClick={acceptSuggestion}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors">
                          <Check className="w-3 h-3" />Accept
                        </button>
                        <button onClick={regenSuggestion}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">
                          <RefreshCw className="w-3 h-3" />Regen
                        </button>
                        <button onClick={() => setSuggestion(null)}
                          className="w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Quick prompts */}
              {assistantMsgs.length === 0 && !suggestion && (
                <div className="px-3 pt-3 space-y-1.5 shrink-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"></p>
                  {[
                    "Improve the flow of this document",
                    "Make the conclusion more impactful",
                    "Suggest a shorter version of the intro",
                  ].map(q => (
                    <button key={q} onClick={() => { setAssistantInput(q); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-slate-600 hover:text-purple-700 hover:bg-purple-50/60 border border-transparent hover:border-purple-200/60 transition-all"
                      style={{ background: "rgba(255,255,255,0.5)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
                {assistantMsgs.map((m, i) => (
                  <div key={i} className={`flex gap-1.5 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[88%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${m.role === "user"
                        ? "bg-purple-100 text-purple-900"
                        : "border border-slate-200/80 text-slate-700"
                      }`} style={m.role === "assistant" ? { background: "rgba(255,255,255,0.82)" } : {}}>
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                    <div className="px-3 py-2 rounded-xl border border-slate-200/80"
                      style={{ background: "rgba(255,255,255,0.82)" }}>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: `${j * 0.2}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="px-3 py-3 border-t border-white/20 shrink-0 flex items-center gap-2">
                <input value={assistantInput} onChange={e => setAssistantInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askAssistant()}
                  placeholder="Ask about your writing…"
                  className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400" />
                <button onClick={askAssistant} disabled={!assistantInput.trim() || isAsking}
                  className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-40 shrink-0"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
                  <Send className="w-3 h-3 text-white" />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed strip */
            <div className="flex flex-col items-center pt-3 gap-2">
              <button onClick={() => setRightOpen(true)}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <Wand2 className="w-4 h-4 text-purple-400" />
            </div>
          )}
        </div>
      </div>

      {/* ── AI suggestion bottom bar (when right panel is closed) ─────────── */}
      {!rightOpen && suggestion && (
        <div className="shrink-0 px-4 py-2.5 border-t border-white/20 flex items-center gap-3"
          style={{ background: "rgba(245,243,255,0.8)" }}>
          <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <p className="flex-1 text-[11px] text-slate-600 italic truncate">"{suggestion.text.trim().slice(0, 120)}…"</p>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={acceptSuggestion}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors">
              <Check className="w-3 h-3" />Accept
            </button>
            <button onClick={() => setSuggestion(null)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
  if (isEmbedded) return _inner;
  return <AppShell hideInputBar>{_inner}</AppShell>;
}
