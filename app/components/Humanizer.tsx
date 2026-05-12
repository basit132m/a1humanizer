"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Subtle",
  2: "Light",
  3: "Mild",
  4: "Moderate",
  5: "Balanced",
  6: "Natural",
  7: "Strong",
  8: "Heavy",
  9: "Intense",
  10: "Maximum",
};

export default function Humanizer() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [level, setLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      toast.error("Please paste some text to humanize.");
      return;
    }
    setLoading(true);
    setOutputText("");
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, level }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setOutputText(data.result ?? "");
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

  const levelPct = ((level - 1) / 9) * 100;

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          AI Humanizer
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Transform AI-generated text into natural, undetectable, human-sounding content.
        </p>
      </div>

      {/* Level Selector */}
      <div
        className="rounded-2xl border p-5 mb-4 transition-colors duration-200"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Rewrite Intensity
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Higher levels make deeper structural changes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold px-3 py-1 rounded-lg"
              style={{
                background: `linear-gradient(135deg, #7c3aed, #2563eb)`,
                color: "#fff",
              }}
            >
              {level} / 10 — {LEVEL_LABELS[level]}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #7c3aed ${levelPct}%, var(--border) ${levelPct}%)`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <span
              key={n}
              className="text-[10px] cursor-pointer select-none"
              style={{
                color: n === level ? "#a855f7" : "var(--text-muted)",
                fontWeight: n === level ? 700 : 400,
              }}
              onClick={() => setLevel(n)}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Text Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Input Panel */}
        <div
          className="rounded-2xl border flex flex-col transition-colors duration-200"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Original Text
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              {wordCount(inputText).toLocaleString()} words
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text here — no limits on length..."
            className="flex-1 bg-transparent p-4 text-sm resize-none outline-none min-h-[320px] leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          />
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={() => { setInputText(""); setOutputText(""); }}
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "var(--text-muted)")}
            >
              Clear
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-500/20"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              }}
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

        {/* Output Panel */}
        <div
          className="rounded-2xl border flex flex-col transition-colors duration-200"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Humanized Result
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              {wordCount(outputText).toLocaleString()} words
            </span>
          </div>

          <div className="flex-1 relative min-h-[320px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 space-y-3"
                >
                  {[92, 78, 95, 65, 88, 72, 85].map((w, i) => (
                    <div
                      key={i}
                      className="h-4 rounded-md animate-pulse"
                      style={{
                        width: `${w}%`,
                        background: "var(--bg-hover)",
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                  ))}
                </motion.div>
              ) : outputText ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 overflow-auto h-full"
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {outputText}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full absolute inset-0"
                >
                  <div className="text-center px-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "var(--bg-hover)" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Your humanized text will appear here
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {outputText && (
            <div
              className="flex items-center justify-end px-4 py-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all"
                style={{
                  background: copied ? "rgba(168,85,247,0.1)" : "var(--bg-hover)",
                  borderColor: copied ? "rgba(168,85,247,0.3)" : "var(--border)",
                  color: copied ? "#a855f7" : "var(--text-secondary)",
                }}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Result
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
