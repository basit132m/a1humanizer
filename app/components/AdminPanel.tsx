"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface KeyEntry {
  key: string;
  label: string;
  createdAt: string;
  active: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState("");
  const [keys, setKeys] = useState<KeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("a1h_access_key") ?? "";
    setAdminKey(key);
  }, []);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        headers: { "x-admin-key": adminKey },
      });
      const data = (await res.json()) as { keys: KeyEntry[] };
      setKeys(data.keys ?? []);
    } catch {
      toast.error("Failed to load keys.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ label: newLabel }),
      });
      const data = (await res.json()) as { key?: KeyEntry; error?: string };
      if (data.error) throw new Error(data.error);
      toast.success(`Key generated for "${data.key!.label}"`);
      setNewLabel("");
      await fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate key.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (key: string, label: string) => {
    if (!confirm(`Revoke access key for "${label}"? They will lose access immediately.`)) return;
    try {
      const res = await fetch("/api/admin/revoke-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ key, action: "revoke" }),
      });
      const data = (await res.json()) as { success: boolean };
      if (data.success) {
        toast.success(`Key for "${label}" revoked.`);
        await fetchKeys();
      }
    } catch {
      toast.error("Failed to revoke key.");
    }
  };

  const handleDelete = async (key: string, label: string) => {
    if (!confirm(`Permanently delete key for "${label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/revoke-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ key, action: "delete" }),
      });
      const data = (await res.json()) as { success: boolean };
      if (data.success) {
        toast.success(`Key deleted.`);
        await fetchKeys();
      }
    } catch {
      toast.error("Failed to delete key.");
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Key copied!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const active = keys.filter((k) => k.active);
  const revoked = keys.filter((k) => !k.active);
  const displayed = showRevoked ? keys : active;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          Admin Panel
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">
          Generate and manage access keys for your team.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Keys", value: keys.length, color: "text-purple-400" },
          { label: "Active", value: active.length, color: "text-emerald-400" },
          { label: "Revoked", value: revoked.length, color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-4 text-center"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
            }}
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[var(--text-secondary)] text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Generate new key */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[var(--text-primary)] font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate New Key
        </h3>
        <form onSubmit={handleGenerate} className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Team member name or label..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              "Generate Key"
            )}
          </motion.button>
        </form>
      </div>

      {/* Keys list */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-[var(--text-primary)] font-semibold text-sm">
            Access Keys
          </h3>
          <button
            onClick={() => setShowRevoked(!showRevoked)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              background: showRevoked ? "rgba(168,85,247,0.1)" : "transparent",
            }}
          >
            {showRevoked ? "Hide Revoked" : `Show Revoked (${revoked.length})`}
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <svg className="w-6 h-6 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">
            {showRevoked ? "No keys found." : "No active keys. Generate one above."}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            <AnimatePresence>
              {displayed.map((entry) => (
                <motion.li
                  key={entry.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ opacity: entry.active ? 1 : 0.5 }}
                >
                  {/* Status dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.active ? "bg-emerald-400" : "bg-red-400"}`}
                  />

                  {/* Label + key */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                      {entry.label}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs font-mono mt-0.5 truncate">
                      {entry.key}
                    </p>
                  </div>

                  {/* Date */}
                  <span className="text-[var(--text-muted)] text-xs flex-shrink-0 hidden sm:block">
                    {formatDate(entry.createdAt)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copy */}
                    <button
                      onClick={() => copyKey(entry.key)}
                      title="Copy key"
                      className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {copiedKey === entry.key ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>

                    {/* Revoke / Delete */}
                    {entry.active ? (
                      <button
                        onClick={() => handleRevoke(entry.key, entry.label)}
                        title="Revoke key"
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(entry.key, entry.label)}
                        title="Delete permanently"
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
