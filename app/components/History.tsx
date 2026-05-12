"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface HistoryEntry {
  id: string;
  timestamp: string;
  original: string;
  humanized: string;
  style: string;
  tone: string;
  purpose: string;
  level: number;
  wordCount: number;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(text: string, len = 120) {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

const STYLE_ICONS: Record<string, string> = {
  humanize: "✦", academic: "🎓", professional: "💼", casual: "💬", creative: "✨", technical: "⚙️",
};

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<Record<string, "original" | "humanized">>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("a1h_history");
      setEntries(raw ? (JSON.parse(raw) as HistoryEntry[]) : []);
    } catch {
      setEntries([]);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("a1h_history", JSON.stringify(updated));
    toast.success("Entry removed.");
  };

  const handleClearAll = () => {
    if (!confirm("Clear all history? This cannot be undone.")) return;
    setEntries([]);
    localStorage.removeItem("a1h_history");
    toast.success("History cleared.");
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleReuse = (entry: HistoryEntry) => {
    sessionStorage.setItem("a1h_reuse", entry.original);
    window.location.href = "/humanizer";
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>History</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your last 20 humanizations are saved automatically.</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <svg className="w-8 h-8" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No history yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Humanize some text and it will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>History</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {entries.length} saved {entries.length === 1 ? "entry" : "entries"} — auto-saved, up to 20.
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs px-3 py-1.5 rounded-xl border transition-all"
          style={{ borderColor: "rgba(239,68,68,0.2)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry, idx) => {
            const isExpanded = expanded === entry.id;
            const textView = view[entry.id] ?? "humanized";

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  style={{ borderBottom: isExpanded ? `1px solid var(--border)` : "none" }}
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <span className="text-lg">{STYLE_ICONS[entry.style] ?? "✦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {truncate(entry.original, 80)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(entry.timestamp)}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>·</span>
                      <span className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>{entry.style}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Level {entry.level}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReuse(entry); }}
                      className="text-xs px-2 py-1 rounded-lg border transition-all"
                      style={{ borderColor: "rgba(168,85,247,0.2)", color: "#c084fc", background: "rgba(168,85,247,0.08)" }}
                    >
                      Reuse
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      className="p-1 rounded-lg transition-all"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg
                      className="w-4 h-4 transition-transform"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none", color: "var(--text-muted)" }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Toggle */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                        {(["original", "humanized"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setView((prev) => ({ ...prev, [entry.id]: v }))}
                            className="text-xs px-3 py-1 rounded-lg capitalize transition-all"
                            style={{
                              background: textView === v ? "rgba(168,85,247,0.15)" : "var(--bg-hover)",
                              color: textView === v ? "#c084fc" : "var(--text-muted)",
                            }}
                          >
                            {v}
                          </button>
                        ))}
                        <button
                          onClick={() => handleCopy(textView === "original" ? entry.original : entry.humanized)}
                          className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-hover)" }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                          {textView === "original" ? entry.original : entry.humanized}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
