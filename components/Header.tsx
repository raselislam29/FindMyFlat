"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Home,
  PlusCircle,
  MessageCircle,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export function Header({ onPostClick }: { onPostClick?: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e9dfd6] bg-[#f7f2ee]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-800 transition-opacity hover:opacity-90"
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1e2430] text-[#f7f2ee] shadow-[0_18px_40px_rgba(30,36,48,0.18)]"
              >
                <Home className="h-5 w-5" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden text-2xl font-black tracking-[-0.08em] text-[#1f2937] sm:block"
              >
                {t("appTitle")}
              </motion.span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center rounded-full border border-[#e7ddd3] bg-white/70 p-1.5 shadow-[0_8px_22px_rgba(17,24,39,0.05)]"
            >
              <button
                onClick={() => setLanguage("bn")}
                className={`rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  language === "bn"
                    ? "bg-[#1e2430] text-[#f7f2ee] shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  language === "en"
                    ? "bg-[#d6a57a] text-[#1f2937] shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </motion.div>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("open-chats"))
                      }
                      className="rounded-full p-2.5 text-slate-600 transition-colors hover:bg-[#f3e7dc] hover:text-[#1f2937]"
                      title="Messages"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onPostClick}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1e2430] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f7f2ee] shadow-[0_16px_30px_rgba(30,36,48,0.2)] transition-all hover:bg-[#2d3748]"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <Sparkles className="h-3 w-3" />
                      <span className="hidden sm:inline">{t("postRental")}</span>
                    </motion.button>

                    <div className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        className="flex items-center gap-2"
                      >
                        <div className="relative">
                          <img
                            src={
                              user.photoURL ||
                              `https://ui-avatars.com/api/?name=${user.email}`
                            }
                            alt="User"
                            className="h-10 w-10 rounded-full border-2 border-[#d9bca4] object-cover shadow-[0_10px_25px_rgba(30,36,48,0.12)]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#3ebd7b]"></div>
                        </div>
                      </motion.button>

                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        whileHover={{ opacity: 1, y: 0, scale: 1 }}
                        className="pointer-events-none absolute right-0 mt-2 w-48 origin-top-right scale-95 rounded-2xl border border-[#e9dfd6] bg-white/90 p-2 opacity-0 shadow-[0_25px_45px_rgba(17,24,39,0.12)] transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:scale-100"
                      >
                        <Link
                          href="/dashboard"
                          className="mb-1 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#f7f2ee]"
                        >
                          <LayoutDashboard className="h-4 w-4 text-[#b8754a]" />
                          Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("logout")}
                        </button>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-login", {
                            detail: { mode: "login" },
                          }),
                        )
                      }
                      className="rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-[#f3e7dc]"
                    >
                      {t("signIn")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-login", {
                            detail: { mode: "signup" },
                          }),
                        )
                      }
                      className="rounded-full bg-[#1e2430] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f7f2ee] shadow-[0_16px_28px_rgba(30,36,48,0.2)] transition-all hover:bg-[#2a3344]"
                    >
                      {t("signUp")}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
