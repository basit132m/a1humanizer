"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function Humanizer() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [level, setLevel] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to humanize.");
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

      const data = await res.json() as { result?: string; error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Failed to humanize");
      }

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
    toast.success("Copied to clipboard!");
  };

  const levelLabels: Record<number, string> = {
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

  const levelColors = [
    "from-blue-500 to-cyan-500",
    "from-blue-500 to-teal-500",
    "from-teal-500 to-green-500",
    "from-green-500 to-yellow-500",
    "from-yellow-500 to-orange-400",
    "from-orange-400 to-orange-500",
    "from-orange-500 to-red-400",
    "from-red-400 to-red-500",
    "from-red-500 to-purple-500",
    "from-purple-500 to-pink-500",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">AI Humanizer</h2>
        <p className="text-gray-400 text-sm">
          Transform AI-generated text into natural, human-sounding content.
        </p>
      </div>

      {/* Level Selector */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300 text-sm font-medium">Rewrite Intensity</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-lg bg-gradient-to-r ${levelColors[level - 1]} text-white`}>
            Level {level} — {levelLabels[level]}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-500"
          style={{
            background: `linear-gradient(to right, #7c3aed ${(level - 1) * 11.1}%, #1e1e2e ${(level - 1) * 11.1}%)`,
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-gray-600 text-xs">Subtle</span>
          <span className="text-gray-600 text-xs">Maximum</span>
        </div>
      </div>

      {/* Text Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Input */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm font-semibold">Original Text</span>
            <span className="text-gray-500 text-xs">{countWords(inputText)} words</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text here..."
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none min-h-[300px]"
          />
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
            <button
              onClick={() => setInputText("")}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              Clear
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2 rounded-xl transition-all flex items-center gap-2"
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

        {/* Output */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm font-semibold">Humanized Result</span>
            <span className="text-gray-500 text-xs">{countWords(outputText)} words</span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 space-y-3 min-h-[300px]"
              >
                {[80, 95, 70, 90, 60, 85].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-white/5 rounded animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </motion.div>
            ) : outputText ? (
              <motion.div
                key="output"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-auto min-h-[300px]"
              >
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{outputText}</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Your humanized text will appear here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {outputText && (
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
