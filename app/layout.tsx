import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./components/ThemeProvider";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('a1h_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-white dark:!bg-[#1a1a2e] !text-gray-900 dark:!text-gray-100 !border !border-gray-200 dark:!border-white/10 !rounded-xl !text-sm !shadow-lg",
              success: {
                iconTheme: { primary: "#a855f7", secondary: "transparent" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "transparent" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
