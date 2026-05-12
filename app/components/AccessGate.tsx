"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccessGateProps {
  onUnlock: (key: string, isAdmin: boolean) => void;
}

export default function AccessGate({ onUnlock }: AccessGateProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = (await res.json()) as { valid: boolean; isAdmin: boolean };

      if (data.valid) {
        localStorage.setItem("a1h_access_key", key.trim());
        onUnlock(key.trim(), data.isAdmin);
      } else {
        setError("Invalid access key. Please check and try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-200"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-purple-600" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl bg-blue-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-2xl border p-8 shadow-2xl transition-colors duration-200"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              A1 Humanizer
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Enter your access key to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError("");
              }}
              placeholder="Enter access key..."
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
              style={{
                background: "var(--bg-input)",
                borderColor: error ? "#ef4444" : "var(--border)",
                color: "var(--text-primary)",
              }}
              autoFocus
              autoComplete="off"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating...
                </>
              ) : (
                "Unlock Access"
              )}
            </motion.button>
          </form>

          <p
            className="text-center text-xs mt-6"
            style={{ color: "var(--text-muted)" }}
          >
            Need a key? Contact your administrator.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
