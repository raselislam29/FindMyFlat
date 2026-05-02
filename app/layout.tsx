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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body
        suppressHydrationWarning
        className="bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 font-sans antialiased min-h-screen selection:bg-gradient-to-r selection:from-pink-200 selection:to-purple-200 selection:text-purple-900"
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-[-1]">
          {/* Primary gradient blob */}
          <div
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
            style={{
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0) 70%)",
              animation: "float 8s ease-in-out infinite",
            }}
          ></div>

          {/* Secondary gradient blob */}
          <div
            className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 70%)",
              animation: "float 10s ease-in-out infinite 1s",
            }}
          ></div>

          {/* Tertiary gradient blob */}
          <div
            className="absolute -bottom-32 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(167, 139, 250, 0) 70%)",
              animation: "float 12s ease-in-out infinite 2s",
            }}
          ></div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
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
