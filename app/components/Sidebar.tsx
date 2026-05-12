"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

const navItems = [
  {
    href: "/humanizer",
    label: "Humanizer",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    href: "/detector",
    label: "AI Detector",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({ onLogout, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const allItems = [
    ...navItems,
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin Panel",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <aside
      className="w-64 min-h-screen flex flex-col border-r transition-colors duration-200"
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>
              A1 Humanizer
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI Content Tools
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider px-3 mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Tools
        </p>
        {allItems.map((item) => {
          const isActive = pathname === item.href;
          const isAdminLink = item.href === "/admin";
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive
                    ? isAdminLink
                      ? "rgba(234,179,8,0.12)"
                      : "rgba(168,85,247,0.12)"
                    : "transparent",
                  color: isActive
                    ? isAdminLink
                      ? "#facc15"
                      : "#c084fc"
                    : "var(--text-secondary)",
                  border: isActive
                    ? isAdminLink
                      ? "1px solid rgba(234,179,8,0.2)"
                      : "1px solid rgba(168,85,247,0.2)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                }}
              >
                <span>{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
                {isAdminLink && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    ADMIN
                  </span>
                )}
                {isActive && !isAdminLink && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-4 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
          }
        >
          {theme === "dark" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Dark Mode</span>
            </>
          )}
          {/* Toggle pill */}
          <div
            className="ml-auto w-9 h-5 rounded-full flex items-center transition-all duration-300 px-0.5"
            style={{
              background: theme === "light" ? "#a855f7" : "rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
              style={{ transform: theme === "light" ? "translateX(16px)" : "translateX(0)" }}
            />
          </div>
        </button>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
