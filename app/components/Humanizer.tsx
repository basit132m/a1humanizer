"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { computeReadability, ReadabilityResult } from "@/lib/readability";
import type { StylePreset, TonePreset, PurposePreset } from "@/lib/claude";

/* ─────────────────────────── types ─────────────────────────── */
interface DiffToken {
  word: string;
  changed: boolean;
  isSpace: boolean;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  original: string;
  humanized: string;
  style: StylePreset;
  tone: TonePreset;
  purpose: PurposePreset;
  level: number;
  wordCount: number;
}

/* ─────────────────────── preset configs ────────────────────── */
const STYLES: { value: StylePreset; label: string; icon: string }[] = [
  { value: "humanize", label: "Humanize", icon: "✦" },
  { value: "academic", label: "Academic", icon: "🎓" },
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "casual", label: "Casual", icon: "💬" },
  { value: "creative", label: "Creative", icon: "✨" },
  { value: "technical", label: "Technical", icon: "⚙️" },
];

const TONES: { value: TonePreset; label: string }[] = [
  { value: "auto", label: "Auto (match original)" },
  { value: "conversational", label: "Conversational" },
  { value: "journalistic", label: "Journalistic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "storytelling", label: "Storytelling" },
  { value: "analytical", label: "Analytical" },
  { value: "formal", label: "Formal" },
];

const PURPOSES: { value: PurposePreset; label: string }[] = [
  { value: "general", label: "General" },
  { value: "essay", label: "Essay" },
  { value: "article", label: "Article / Blog" },
  { value: "email", label: "Email" },
  { value: "marketing", label: "Marketing" },
  { value: "report", label: "Report" },
  { value: "story", label: "Story" },
  { value: "social", label: "Social Media" },
];

const LEVEL_LABELS: Record<number, string> = {
  1: "Subtle", 2: "Light", 3: "Mild", 4: "Moderate", 5: "Balanced",
  6: "Natural", 7: "Strong", 8: "Heavy", 9: "Intense", 10: "Maximum",
};

/* ─────────────────────── helpers ───────────────────────────── */
function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function buildDiff(original: string, humanized: string): DiffToken[] {
  const origSet = new Set(
    original.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/)
  );
  const tokens = humanized.split(/(\s+)/);
  return tokens.map((token) => {
    if (/^\s+$/.test(token)) return { word: token, changed: false, isSpace: true };
    const clean = token.toLowerCase().replace(/[^\w]/g, "");
    const changed = clean.length > 3 && !origSet.has(clean);
    return { word: token, changed, isSpace: false };
  });
}

function saveToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  try {
    const raw = localStorage.getItem("a1h_history");
    const history: HistoryEntry[] = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 20);
    localStorage.setItem("a1h_history", JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────── component ─────────────────────────── */
export default function Humanizer() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [level, setLevel] = useState(5);
  const [style, setStyle] = useState<StylePreset>("humanize");
  const [tone, setTone] = useState<TonePreset>("auto");
  const [purpose, setPurpose] = useState<PurposePreset>("general");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffTokens, setDiffTokens] = useState<DiffToken[] | null>(null);
  const [outputReadability, setOutputReadability] = useState<ReadabilityResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pick up text passed via "Reuse" from History page
  useState(() => {
    try {
      const reuse = sessionStorage.getItem("a1h_reuse");
      if (reuse) { setInputText(reuse); sessionStorage.removeItem("a1h_reuse"); }
    } catch { /* ignore */ }
  });

  const handleHumanize = async () => {
    if (!inputText.trim()) { toast.error("Please paste some text to humanize."); return; }
    setLoading(true);
    setOutputText("");
    setDiffTokens(null);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, level, style, tone, purpose }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");

      const humanized = data.result ?? "";
      setOutputText(humanized);
      setDiffTokens(buildDiff(inputText, humanized));
      const outR = computeReadability(humanized);
      setOutputReadability(outR);

      saveToHistory({
        original: inputText,
        humanized,
        style,
        tone,
        purpose,
        level,
        wordCount: wordCount(humanized),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(txt|md)$/i)) {
      toast.error("Only .txt and .md files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInputText((ev.target?.result as string) ?? "");
      toast.success(`Loaded: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const levelPct = ((level - 1) / 9) * 100;
  const inWords = wordCount(inputText);
  const outWords = wordCount(outputText);

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          AI Humanizer
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Transform AI-generated text into natural, undetectable, human-sounding content.
        </p>
      </div>

      {/* Controls Panel */}
      <div
        className="rounded-2xl border p-5 mb-4 space-y-4"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        {/* Style Presets */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Writing Style
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 border"
                style={{
                  background: style === s.value ? "rgba(168,85,247,0.15)" : "var(--bg-hover)",
                  borderColor: style === s.value ? "rgba(168,85,247,0.4)" : "var(--border)",
                  color: style === s.value ? "#c084fc" : "var(--text-secondary)",
                }}
              >
                <span className="text-base leading-none">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone + Purpose + Level */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tone */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Tone
            </p>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as TonePreset)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Purpose
            </p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as PurposePreset)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Intensity
              </p>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
              >
                {level} / 10 — {LEVEL_LABELS[level]}
              </span>
            </div>
            <input
              type="range" min={1} max={10} step={1} value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full mt-1"
              style={{ background: `linear-gradient(to right, #7c3aed ${levelPct}%, var(--border) ${levelPct}%)` }}
            />
          </div>
        </div>
      </div>

      {/* Text Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Input ── */}
        <div
          className="rounded-2xl border flex flex-col"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Original Text</span>
            <div className="flex items-center gap-3">
              {/* File upload */}
              <input ref={fileRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                title="Upload .txt or .md file"
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-hover)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {inWords.toLocaleString()} words
              </span>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text here — no limits on length..."
            className="flex-1 bg-transparent p-4 text-sm resize-none outline-none leading-relaxed min-h-[300px]"
            style={{ color: "var(--text-primary)" }}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => { setInputText(""); setOutputText(""); setDiffTokens(null); setOutputReadability(null); }}
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Humanizing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Humanize
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Output ── */}
        <div
          className="rounded-2xl border flex flex-col"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Humanized Result</span>
            <div className="flex items-center gap-3">
              {outputText && (
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="text-xs px-2.5 py-1 rounded-lg border transition-all"
                  style={{
                    borderColor: showDiff ? "rgba(168,85,247,0.3)" : "var(--border)",
                    background: showDiff ? "rgba(168,85,247,0.1)" : "var(--bg-hover)",
                    color: showDiff ? "#c084fc" : "var(--text-muted)",
                  }}
                >
                  {showDiff ? "Show Clean" : "Show Diff"}
                </button>
              )}
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {outWords.toLocaleString()} words
              </span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                  {[92, 78, 95, 65, 88, 72, 85, 60].map((w, i) => (
                    <div key={i} className="h-4 rounded-md animate-pulse" style={{ width: `${w}%`, background: "var(--bg-hover)", animationDelay: `${i * 70}ms` }} />
                  ))}
                </motion.div>
              ) : outputText ? (
                <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 overflow-auto h-full">
                  {showDiff && diffTokens ? (
                    <p className="text-sm leading-relaxed">
                      {diffTokens.map((t, i) =>
                        t.isSpace ? (
                          <span key={i}>{t.word}</span>
                        ) : t.changed ? (
                          <span key={i} className="rounded px-0.5" style={{ background: "rgba(134,239,172,0.25)", color: "#22c55e" }}>
                            {t.word}
                          </span>
                        ) : (
                          <span key={i} style={{ color: "var(--text-primary)" }}>{t.word}</span>
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                      {outputText}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-hover)" }}>
                      <svg className="w-6 h-6" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your humanized text will appear here</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Readability Bar */}
          {outputReadability && (
            <div className="px-4 py-3 border-t grid grid-cols-4 gap-2" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Flesch", value: `${outputReadability.fleschReadingEase}`, sub: outputReadability.ease },
                { label: "Grade", value: `${outputReadability.fleschKincaidGrade}`, sub: "FK Grade" },
                { label: "Words", value: outWords.toLocaleString(), sub: "total" },
                { label: "Read", value: `${outputReadability.readingTimeMin}m`, sub: "est. time" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {outputText && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {showDiff ? (
                  <><span style={{ color: "#22c55e" }}>■</span> Green = changed words</>
                ) : "Saved to History automatically"}
              </p>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => downloadText(outputText, "humanized.txt")}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all"
                  style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all"
                  style={{
                    background: copied ? "rgba(168,85,247,0.1)" : "var(--bg-hover)",
                    borderColor: copied ? "rgba(168,85,247,0.3)" : "var(--border)",
                    color: copied ? "#c084fc" : "var(--text-secondary)",
                  }}
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
