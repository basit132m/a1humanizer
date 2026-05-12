import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A1 Humanizer — AI Content Tools",
  description:
    "Transform AI-generated content into natural, human-sounding text. Detect AI-written content instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0f] text-white antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#a855f7", secondary: "#1a1a2e" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#1a1a2e" },
            },
          }}
        />
      </body>
    </html>
  );
}
