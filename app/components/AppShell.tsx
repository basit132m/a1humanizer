"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AccessGate from "./AccessGate";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("a1h_access_key");
    if (stored) {
      // Re-validate stored key
      fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: stored }),
      })
        .then((r) => r.json())
        .then((d: { valid: boolean }) => {
          if (d.valid) {
            setUnlocked(true);
          } else {
            localStorage.removeItem("a1h_access_key");
          }
        })
        .catch(() => {
          // Treat as valid if network error to avoid locking out users
          setUnlocked(true);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("a1h_access_key");
    setUnlocked(false);
    router.push("/humanizer");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
