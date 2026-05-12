"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface DetectionResult {
  score: number;
  signals: string[];
  verdict: "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated";
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getScoreConfig(score: number) {
  if (score <= 25)
    return {
      stroke: "#22c55e",
      textColor: "#4ade80",
      barGrad: "from-green-500 to-emerald-400",
      badge: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20",
      label: "Human",
    };
  if (score <= 50)
    return {
      stroke: "#84cc16",
      textColor: "#a3e635",
      barGrad: "from-lime-500 to-green-400",
      badge: "text-lime-600 bg-lime-50 border-lime-200 dark:text-lime-400 dark:bg-lime-500/10 dark:border-lime-500/20",
      label: "Likely Human",
    };
  if (score <= 70)
    return {
      stroke: "#eab308",
      textColor: "#facc15",
      barGrad: "from-yellow-500 to-orange-400",
      badge: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20",
      label: "Mixed",
    };
  if (score <= 85)
    return {
      stroke: "#f97316",
      textColor: "#fb923c",
      barGrad: "from-orange-500 to-red-400",
      badge: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20",
      label: "Likely AI",
    };
  return {
    stroke: "#ef4444",
    textColor: "#f87171",
    barGrad: "from-red-500 to-rose-400",
    badge: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20",
    label: "AI Generated",
  };
}

export default function Detector() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async () => {
    if (!inputText.trim()) {
      toast.error("Please paste some text to analyze.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = (await res.json()) as { result?: DetectionResult; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setResult(data.result ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? getScoreConfig(result.score) : null;
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          AI Detector
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Analyze any text to determine how likely it was written by AI.
        </p>
      </div>

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
              Text to Analyze
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              {wordCount(inputText).toLocaleString()} words
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text here to detect if it was AI-generated — no length limits..."
            className="flex-1 bg-transparent p-4 text-sm resize-none outline-none min-h-[320px] leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          />
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={() => { setInputText(""); setResult(null); }}
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
              onClick={handleDetect}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-500/20"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  Analyze
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Result Panel */}
        <div
          className="rounded-2xl border flex flex-col transition-colors duration-200"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Detection Result
            </span>
          </div>

          <div className="flex-1 min-h-[320px] relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                >
                  <div
                    className="w-20 h-20 rounded-full border-4 border-t-purple-500 animate-spin"
                    style={{ borderColor: "var(--border)", borderTopColor: "#a855f7" }}
                  />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Analyzing writing patterns...
                  </p>
                </motion.div>
              ) : result && cfg ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 flex flex-col gap-5 h-full overflow-auto"
                >
                  {/* Score circle + verdict */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60" cy="60" r="52"
                          fill="none"
                          strokeWidth="10"
                          style={{ stroke: "var(--border)" }}
                        />
                        <motion.circle
                          cx="60" cy="60" r="52"
                          fill="none"
                          stroke={cfg.stroke}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{
                            strokeDashoffset:
                              circumference - (result.score / 100) * circumference,
                          }}
                          transition={{ duration: 1.1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="text-2xl font-bold"
                          style={{ color: cfg.textColor }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.35 }}
                        >
                          {result.score}%
                        </motion.span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          AI Score
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                        Verdict
                      </p>
                      <span
                        className={`px-3 py-1.5 rounded-full border text-sm font-bold ${cfg.badge}`}
                      >
                        {result.verdict}
                      </span>
                      <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                        {result.score <= 25
                          ? "This text reads as authentic human writing."
                          : result.score <= 50
                          ? "Mostly human with minor AI-like patterns."
                          : result.score <= 70
                          ? "Mix of human and AI writing patterns."
                          : result.score <= 85
                          ? "Strong indicators of AI-generated content."
                          : "Very high probability of AI generation."}
                      </p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div>
                    <div
                      className="flex justify-between text-xs mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>Human</span>
                      <span>AI Generated</span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-hover)" }}
                    >
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${cfg.barGrad}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Signals */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Detected Signals
                    </p>
                    <ul className="space-y-2">
                      {result.signals.map((signal, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 * i }}
                          className="flex items-start gap-2.5 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span
                            className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: cfg.stroke }}
                          />
                          {signal}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "var(--bg-hover)" }}
                    >
                      <svg
                        className="w-6 h-6"
                        style={{ color: "var(--text-muted)" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Analysis results will appear here
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
