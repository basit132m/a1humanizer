"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface DetectionResult {
  score: number;
  signals: string[];
  verdict: "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated";
}


function VerdictBadge({ verdict }: { verdict: DetectionResult["verdict"] }) {
  const config: Record<DetectionResult["verdict"], { color: string; bg: string; border: string }> = {
    Human: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    "Likely Human": { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    Mixed: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    "Likely AI": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    "AI Generated": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  };
  const c = config[verdict];
  return (
    <span className={`px-4 py-1.5 rounded-full border text-sm font-semibold ${c.color} ${c.bg} ${c.border}`}>
      {verdict}
    </span>
  );
}

export default function Detector() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to analyze.");
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

      const data = await res.json() as { result?: DetectionResult; error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Failed to analyze");
      }

      setResult(data.result ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (score: number) => {
    if (score <= 30) return "from-green-500 to-emerald-400";
    if (score <= 60) return "from-yellow-500 to-orange-400";
    return "from-orange-500 to-red-500";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">AI Detector</h2>
        <p className="text-gray-400 text-sm">
          Analyze text to determine if it was written by AI or a human.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Input */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm font-semibold">Text to Analyze</span>
            <span className="text-gray-500 text-xs">
              {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text here to check if it was written by AI..."
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none min-h-[300px]"
          />
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
            <button
              onClick={() => { setInputText(""); setResult(null); }}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              Clear
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDetect}
              disabled={loading || !inputText.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2 rounded-xl transition-all flex items-center gap-2"
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

        {/* Result */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex flex-col">
          <span className="text-gray-300 text-sm font-semibold mb-4">Detection Result</span>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[300px]"
              >
                <div className="w-28 h-28 rounded-full border-4 border-white/5 border-t-purple-500 animate-spin" />
                <p className="text-gray-500 text-sm">Analyzing text patterns...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-6 min-h-[300px]"
              >
                {/* Score + Verdict */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#1e1e2e" strokeWidth="10" />
                      <motion.circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={result.score <= 30 ? "#22c55e" : result.score <= 60 ? "#eab308" : "#ef4444"}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 54}
                        initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 54 - (result.score / 100) * 2 * Math.PI * 54 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className={`text-3xl font-bold ${result.score <= 30 ? "text-green-400" : result.score <= 60 ? "text-yellow-400" : "text-red-400"}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {result.score}%
                      </motion.span>
                      <span className="text-gray-500 text-xs">AI Score</span>
                    </div>
                  </div>
                  <VerdictBadge verdict={result.verdict} />
                </div>

                {/* Score Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Human</span>
                    <span>AI Generated</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${getBarColor(result.score)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Signals */}
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">Detected Signals</p>
                  <ul className="space-y-2">
                    {result.signals.map((signal, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.score <= 30 ? "bg-green-400" : result.score <= 60 ? "bg-yellow-400" : "bg-red-400"}`} />
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
                className="flex-1 flex items-center justify-center min-h-[300px]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Analysis results will appear here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
