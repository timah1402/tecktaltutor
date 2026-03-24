"use client";
import { useState } from "react";
import {
  Settings as SettingsIcon, Brain, Database, Volume2, Search,
  Sun, Moon, Globe, Trash2, AlertTriangle, CheckCircle2, XCircle,
  Mic, Server, Key, Link,
} from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";

type Tab = "overview" | "llm" | "embedding" | "tts" | "search";
type Theme = "light" | "dark";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",   label: "Overview",   icon: <SettingsIcon className="w-3.5 h-3.5" /> },
  { id: "llm",        label: "LLM",        icon: <Brain className="w-3.5 h-3.5" /> },
  { id: "embedding",  label: "Embedding",  icon: <Database className="w-3.5 h-3.5" /> },
  { id: "tts",        label: "TTS",        icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: "search",     label: "Search",     icon: <Search className="w-3.5 h-3.5" /> },
];

const STATUS = [
  { label: "LLM",       ok: true,  detail: "gpt-4o-mini · OpenAI" },
  { label: "Embedding", ok: true,  detail: "text-embedding-3-small" },
  { label: "TTS",       ok: false, detail: "Not configured" },
  { label: "Search",    ok: true,  detail: "DuckDuckGo" },
];

const LANGUAGES = [{ value: "en", label: "EN" }, { value: "zh", label: "中文" }, { value: "fr", label: "FR" }];

export default function SettingsPage() {
  const [tab, setTab]               = useState<Tab>("overview");
  const [theme, setTheme]           = useState<Theme>("light");
  const [language, setLanguage]     = useState("en");
  const [showClear, setShowClear]   = useState(false);
  const [llmProvider, setLlmProvider]   = useState("OpenAI");
  const [llmModel, setLlmModel]         = useState("gpt-4o-mini");
  const [llmKey, setLlmKey]             = useState("");
  const [llmBase, setLlmBase]           = useState("https://api.openai.com/v1");
  const [embProvider, setEmbProvider]   = useState("OpenAI");
  const [embModel, setEmbModel]         = useState("text-embedding-3-small");
  const [ttsProvider, setTtsProvider]   = useState("OpenAI");
  const [ttsVoice, setTtsVoice]         = useState("alloy");
  const [searchProvider, setSearchProvider] = useState("DuckDuckGo");
  const [searchKey, setSearchKey]       = useState("");
  const [voiceLang, setVoiceLang]       = useState("en-US");

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-white/80 bg-white/70 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400/30";
  const selectCls = inputCls + " cursor-pointer";
  const labelCls  = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block";

  return (
    <AppShell>
      <div className="px-4 pt-2 pb-24 space-y-4 max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Settings</h1>
            <p className="text-xs text-slate-500">Configure your AI services and preferences</p>
          </div>
        </div>

        {/* General settings */}
        <GlassCard className="p-4 space-y-4">
          {/* Theme */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 w-24 shrink-0">
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Theme
            </div>
            <div className="flex p-1 rounded-lg gap-1" style={{ background: "rgba(248,250,255,0.8)" }}>
              {(["light", "dark"] as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${theme === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {t === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Language */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 w-24 shrink-0">
              <Globe className="w-4 h-4" />Language
            </div>
            <div className="flex p-1 rounded-lg gap-1" style={{ background: "rgba(248,250,255,0.8)" }}>
              {LANGUAGES.map(l => (
                <button key={l.value} onClick={() => setLanguage(l.value)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${language === l.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Clear data */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 w-24 shrink-0">
              <Trash2 className="w-4 h-4" />Local Data
              <span className="text-xs text-slate-400">(12.4 KB)</span>
            </div>
            <button onClick={() => setShowClear(true)}
              className="px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              Clear Cache
            </button>
          </div>
        </GlassCard>

        {/* Voice settings */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-slate-700">Voice Settings</p>
          </div>
          <div>
            <label className={labelCls}>Voice Language</label>
            <select value={voiceLang} onChange={e => setVoiceLang(e.target.value)} className={selectCls}>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="ar-SA">Arabic (SA)</option>
              <option value="fr-FR">French</option>
              <option value="zh-CN">Chinese (Mandarin)</option>
            </select>
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl gap-1 overflow-x-auto" style={{ background: "rgba(255,255,255,0.5)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${tab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <GlassCard className="overflow-hidden">
          {tab === "overview" && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
              <div className="grid grid-cols-2 gap-3">
                {STATUS.map(s => (
                  <div key={s.label} className={`p-3 rounded-xl border ${s.ok ? "bg-emerald-50/80 border-emerald-200/60" : "bg-red-50/80 border-red-200/60"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {s.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-sm font-semibold text-slate-700">{s.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{s.detail}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/60">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ports</p>
                {[{ label: "Backend API", port: "7862" }, { label: "Frontend", port: "3000" }].map(p => (
                  <div key={p.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Server className="w-4 h-4 text-slate-400" />{p.label}
                    </div>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">:{p.port}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "llm" && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">LLM Configuration</p>
                <p className="text-xs text-slate-500">Configure language model providers</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Provider</label>
                  <select value={llmProvider} onChange={e => setLlmProvider(e.target.value)} className={selectCls}>
                    {["OpenAI", "Ollama", "Anthropic", "Google Gemini", "Azure OpenAI"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Model Name</label>
                  <input type="text" value={llmModel} onChange={e => setLlmModel(e.target.value)} placeholder="gpt-4o-mini" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={llmKey} onChange={e => setLlmKey(e.target.value)} placeholder="sk-…" className={inputCls + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Base URL</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={llmBase} onChange={e => setLlmBase(e.target.value)} className={inputCls + " pl-10"} />
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Save Configuration</button>
              </div>
            </div>
          )}

          {tab === "embedding" && (
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Embedding Configuration</p>
                <p className="text-xs text-slate-500">Configure embedding model providers</p>
              </div>
              <div>
                <label className={labelCls}>Provider</label>
                <select value={embProvider} onChange={e => setEmbProvider(e.target.value)} className={selectCls}>
                  {["OpenAI", "Ollama", "Cohere", "HuggingFace"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Model Name</label>
                <input type="text" value={embModel} onChange={e => setEmbModel(e.target.value)} placeholder="text-embedding-3-small" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Dimensions</label>
                <input type="number" defaultValue={1536} className={inputCls} />
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Save Configuration</button>
            </div>
          )}

          {tab === "tts" && (
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">TTS Configuration</p>
                <p className="text-xs text-slate-500">Configure text-to-speech providers</p>
              </div>
              <div>
                <label className={labelCls}>Provider</label>
                <select value={ttsProvider} onChange={e => setTtsProvider(e.target.value)} className={selectCls}>
                  {["OpenAI", "ElevenLabs", "Google", "Azure"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Voice</label>
                <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} className={selectCls}>
                  {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Save Configuration</button>
            </div>
          )}

          {tab === "search" && (
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Search Configuration</p>
                <p className="text-xs text-slate-500">Configure web search providers</p>
              </div>
              <div>
                <label className={labelCls}>Provider</label>
                <select value={searchProvider} onChange={e => setSearchProvider(e.target.value)} className={selectCls}>
                  {["DuckDuckGo", "Tavily", "Bing", "Google", "SerpAPI"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={searchKey} onChange={e => setSearchKey(e.target.value)} placeholder="Optional for DuckDuckGo…" className={inputCls + " pl-10"} />
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4f8ef7, #7c5ef8)" }}>Save Configuration</button>
            </div>
          )}
        </GlassCard>

        {/* Clear modal */}
        {showClear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="glass-bright rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Confirm Clear</h3>
                  <p className="text-xs text-slate-500">This will clear all locally cached data</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Including: chat history, solver sessions, question results, research reports, and all locally stored data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowClear(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setShowClear(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
