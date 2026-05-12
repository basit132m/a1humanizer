"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AccessGate from "./AccessGate";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AppShell({ children, requireAdmin = false }: AppShellProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem("a1h_access_key") ?? "";
    if (!key) {
      setChecking(false);
      return;
    }
    fetch("/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then((r) => r.json())
      .then((d: { valid: boolean; isAdmin: boolean }) => {
        if (d.valid) {
          setUnlocked(true);
          setIsAdmin(d.isAdmin);
        } else {
          localStorage.removeItem("a1h_access_key");
        }
      })
      .catch(() => {
        setUnlocked(true);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleUnlock = (_key: string, admin: boolean) => {
    setIsAdmin(admin);
    setUnlocked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("a1h_access_key");
    setUnlocked(false);
    setIsAdmin(false);
    router.push("/humanizer");
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-purple-500 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "#a855f7" }}
        />
      </div>
    );
  }

  if (!unlocked) {
    return <AccessGate onUnlock={handleUnlock} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Sidebar onLogout={handleLogout} isAdmin={isAdmin} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Admin Access Required
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You need an admin key to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar onLogout={handleLogout} isAdmin={isAdmin} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
