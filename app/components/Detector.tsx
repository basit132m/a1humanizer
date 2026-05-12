"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { analyzeText, LocalDetectionMetrics, SentenceScore } from "@/lib/aidetector";

interface DetectionResult {
  score: number;
  signals: string[];
  verdict: "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated";
}

function wc(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getScoreConfig(score: number) {
  if (score <= 25) return { stroke: "#22c55e", textColor: "#4ade80", bar: "from-green-500 to-emerald-400", badge: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20" };
  if (score <= 50) return { stroke: "#84cc16", textColor: "#a3e635", bar: "from-lime-500 to-green-400", badge: "text-lime-700 bg-lime-50 border-lime-200 dark:text-lime-400 dark:bg-lime-500/10 dark:border-lime-500/20" };
  if (score <= 70) return { stroke: "#eab308", textColor: "#facc15", bar: "from-yellow-500 to-orange-400", badge: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20" };
  if (score <= 85) return { stroke: "#f97316", textColor: "#fb923c", bar: "from-orange-500 to-red-400", badge: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20" };
  return { stroke: "#ef4444", textColor: "#f87171", bar: "from-red-500 to-rose-400", badge: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20" };
}

function sentenceColor(label: SentenceScore["label"]) {
  if (label === "human") return "rgba(34,197,94,0.12)";
  if (label === "maybe") return "rgba(234,179,8,0.12)";
  return "rgba(239,68,68,0.12)";
}
function sentenceBorder(label: SentenceScore["label"]) {
  if (label === "human") return "rgba(34,197,94,0.3)";
  if (label === "maybe") return "rgba(234,179,8,0.3)";
  return "rgba(239,68,68,0.3)";
}

/* ─── Metric Bar ─── */
function MetricBar({ label, value, isAiHigh, description }: { label: string; value: number; isAiHigh: boolean; description: string }) {
  const clampedVal = Math.max(0, Math.min(100, value));
  // isAiHigh=true means high value = more AI (red direction)
  // isAiHigh=false means high value = more human (green direction)
  const displayVal = isAiHigh ? clampedVal : (100 - clampedVal);
  const barColor = displayVal > 65 ? "#ef4444" : displayVal > 40 ? "#eab308" : "#22c55e";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }} title={description}>{label}</span>
        <span className="text-xs tabular-nums font-bold" style={{ color: barColor }}>{clampedVal}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedVal}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function Detector() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [localMetrics, setLocalMetrics] = useState<LocalDetectionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "heatmap" | "phrases">("results");

  const handleDetect = async () => {
    if (!inputText.trim()) { toast.error("Please paste some text to analyze."); return; }
    setLoading(true);
    setResult(null);
    setLocalMetrics(null);

    // Run local analysis instantly
    const local = analyzeText(inputText);
    setLocalMetrics(local);

    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = (await res.json()) as { result?: DetectionResult; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setResult(data.result ?? null);
      setActiveTab("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? getScoreConfig(result.score) : null;
  const circumference = 2 * Math.PI * 52;

  const METRICS = localMetrics ? [
    { label: "Burstiness", value: localMetrics.burstiness, isAiHigh: false, description: "Sentence length variation (higher = more human)" },
    { label: "Vocab Diversity", value: localMetrics.vocabularyDiversity, isAiHigh: false, description: "Unique word ratio (higher = more human)" },
    { label: "Contraction Use", value: localMetrics.contractionRatio, isAiHigh: false, description: "Contractions like don't/can't (higher = more human)" },
    { label: "Sent. Start Diversity", value: localMetrics.sentenceStartDiversity, isAiHigh: false, description: "Varied sentence openings (higher = more human)" },
    { label: "AI Phrase Density", value: localMetrics.aiPhraseDensity, isAiHigh: true, description: "Stock AI phrases found (lower = more human)" },
    { label: "Passive Voice", value: localMetrics.passiveVoiceRatio, isAiHigh: true, description: "Passive voice usage (lower = more human)" },
    { label: "Hedging Language", value: localMetrics.hedgingRatio, isAiHigh: true, description: "May/might/could/possibly (lower = more human)" },
    { label: "Transition Words", value: localMetrics.transitionRatio, isAiHigh: true, description: "Furthermore/moreover etc. (lower = more human)" },
    { label: "Repeated Trigrams", value: localMetrics.repeatedTrigramRatio, isAiHigh: true, description: "Repeated 3-word sequences (lower = more human)" },
  ] : [];

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>AI Detector</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Deep analysis combining Claude AI + 9 local pattern metrics + sentence-level heatmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Input */}
        <div className="rounded-2xl border flex flex-col" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Text to Analyze</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{wc(inputText).toLocaleString()} words</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text to check if it's AI-generated — no length limits..."
            className="flex-1 bg-transparent p-4 text-sm resize-none outline-none leading-relaxed min-h-[300px]"
            style={{ color: "var(--text-primary)" }}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => { setInputText(""); setResult(null); setLocalMetrics(null); }} className="text-xs" style={{ color: "var(--text-muted)" }}>Clear</button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleDetect}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analyzing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>Analyze</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-2xl border flex flex-col" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          {/* Tab bar */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["results", "heatmap", "phrases"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={!localMetrics && !result}
                className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 capitalize"
                style={{
                  borderColor: activeTab === tab ? "#a855f7" : "transparent",
                  color: activeTab === tab ? "#c084fc" : "var(--text-muted)",
                }}
              >
                {tab === "results" ? "Results" : tab === "heatmap" ? "Heatmap" : "Phrases"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto min-h-[300px] relative">
            <AnimatePresence mode="wait">
              {/* ── LOADING ── */}
              {loading && !localMetrics && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "#a855f7" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Running deep analysis...</p>
                </motion.div>
              )}

              {/* ── RESULTS TAB ── */}
              {(result || localMetrics) && activeTab === "results" && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
                  {/* Claude score */}
                  {result && cfg && (
                    <div className="flex items-center gap-5">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" style={{ stroke: "var(--border)" }} />
                          <motion.circle cx="60" cy="60" r="52" fill="none" stroke={cfg.stroke} strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference - (result.score / 100) * circumference }}
                            transition={{ duration: 1.1, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold" style={{ color: cfg.textColor }}>{result.score}%</span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>AI Score</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`px-3 py-1.5 rounded-full border text-sm font-bold ${cfg.badge}`}>{result.verdict}</span>
                        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                          <motion.div className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
                            initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
                            transition={{ duration: 1.1, ease: "easeOut" }} />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <span>Human</span><span>AI Generated</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Local metrics */}
                  {localMetrics && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pattern Metrics</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                          Local score: {localMetrics.overallLocalScore}%
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {METRICS.map((m) => (
                          <MetricBar key={m.label} {...m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Claude signals */}
                  {result?.signals && result.signals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Detected Signals</p>
                      <ul className="space-y-1.5">
                        {result.signals.map((sig, i) => (
                          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg?.stroke ?? "#a855f7" }} />
                            {sig}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── HEATMAP TAB ── */}
              {localMetrics && activeTab === "heatmap" && (
                <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
                  <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    Each sentence is colored by AI likelihood:&nbsp;
                    <span style={{ color: "#22c55e" }}>■ Human</span>&nbsp;
                    <span style={{ color: "#eab308" }}>■ Mixed</span>&nbsp;
                    <span style={{ color: "#ef4444" }}>■ AI</span>
                  </p>
                  <div className="space-y-2">
                    {localMetrics.sentenceScores.map((s, i) => (
                      <div key={i} className="rounded-xl p-2.5 border text-sm leading-relaxed"
                        style={{ background: sentenceColor(s.label), borderColor: sentenceBorder(s.label), color: "var(--text-primary)" }}>
                        {s.text}
                        {s.reasons.length > 0 && (
                          <p className="text-[10px] mt-1 opacity-70">{s.reasons.join(" · ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PHRASES TAB ── */}
              {localMetrics && activeTab === "phrases" && (
                <motion.div key="phrases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
                  {localMetrics.foundPhrases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No AI phrases found!</p>
                      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>The text does not contain common AI stock phrases.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                        Found <strong style={{ color: "#f87171" }}>{localMetrics.foundPhrases.length}</strong> AI stock phrase{localMetrics.foundPhrases.length > 1 ? "s" : ""}. These are strong AI signals.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {localMetrics.foundPhrases.map((phrase) => (
                          <span key={phrase} className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                            &ldquo;{phrase}&rdquo;
                          </span>
                        ))}
                      </div>
                      <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
                        Run these through the Humanizer to remove them.
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── EMPTY ── */}
              {!result && !localMetrics && !loading && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-hover)" }}>
                      <svg className="w-6 h-6" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Paste text and click Analyze</p>
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
