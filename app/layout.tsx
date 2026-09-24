import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "FindMyFlat - Discover Your Perfect Home",
  description:
    "A modern, fast, and intelligent rental discovery platform. Find your ideal apartment in NYC with real-time listings and advanced search.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#f6f1eb] text-slate-800 font-sans antialiased min-h-screen selection:bg-[#d9bca4] selection:text-[#1f2937]"
      >
        <div className="fixed inset-0 pointer-events-none z-[-1]">
          <div
            className="absolute -top-24 left-8 h-80 w-80 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(214, 153, 99, 0.28) 0%, rgba(214, 153, 99, 0) 68%)",
              animation: "float 10s ease-in-out infinite",
            }}
          ></div>

          <div
            className="absolute right-0 top-1/4 h-96 w-96 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(65, 77, 95, 0.16) 0%, rgba(65, 77, 95, 0) 70%)",
              animation: "float 12s ease-in-out infinite 1.5s",
            }}
          ></div>

          <div
            className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(212, 109, 82, 0.18) 0%, rgba(212, 109, 82, 0) 72%)",
              animation: "float 14s ease-in-out infinite 3s",
            }}
          ></div>

          <div
            className="absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(41, 44, 52, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(41, 44, 52, 0.6) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          ></div>
        </div>

        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
