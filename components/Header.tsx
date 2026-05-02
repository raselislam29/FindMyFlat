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
  const { user, login, logout, loading } = useAuth();

  return (
    <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-10 border-b border-white/20 transition-all shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-800 hover:opacity-90 transition-opacity group"
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="gradient-overlay-primary text-white p-2.5 rounded-2xl shadow-glow-pink hover:shadow-glow-pink"
              >
                <Home className="h-6 w-6" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-display font-extrabold text-2xl tracking-tight hidden sm:block text-gradient-primary"
              >
                {t("appTitle")}
              </motion.span>
            </Link>
          </div>

          <div className="flex items-center gap-5">
            {/* Language Switcher - Modern Design */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center bg-gradient-to-r from-slate-100/50 to-slate-50/50 backdrop-blur-sm rounded-full p-1.5 border border-slate-200/50 shadow-soft"
            >
              <button
                onClick={() => setLanguage("bn")}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-bold transition-all duration-300 ${
                  language === "bn"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-bold transition-all duration-300 ${
                  language === "en"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
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
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("open-chats"))
                      }
                      className="text-slate-600 hover:text-pink-500 transition-colors p-2.5 rounded-full hover:bg-pink-50"
                      title="Messages"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onPostClick}
                      className="inline-flex items-center gap-2 px-6 py-2.5 btn-primary text-xs font-bold rounded-full shadow-glow-purple"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <Sparkles className="h-3 w-3" />
                      <span className="hidden sm:inline uppercase tracking-widest text-[10px]">
                        {t("postRental")}
                      </span>
                    </motion.button>

                    <div className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        <div className="relative">
                          <img
                            src={
                              user.photoURL ||
                              `https://ui-avatars.com/api/?name=${user.email}`
                            }
                            alt="User"
                            className="w-10 h-10 rounded-full border-2 border-gradient-to-r from-pink-400 to-purple-400 shadow-glow-purple"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                      </motion.button>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        whileHover={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100 p-2 group-hover:pointer-events-auto pointer-events-none"
                      >
                        <Link
                          href="/dashboard"
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-colors font-semibold flex items-center gap-2 mb-1"
                        >
                          <LayoutDashboard className="h-4 w-4 text-purple-500" />
                          Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 rounded-xl transition-colors font-semibold flex items-center gap-2"
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
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-login", {
                            detail: { mode: "login" },
                          }),
                        )
                      }
                      className="text-xs uppercase tracking-widest font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 transition-colors hover:bg-slate-100 rounded-lg"
                    >
                      {t("signIn")}
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-login", {
                            detail: { mode: "signup" },
                          }),
                        )
                      }
                      className="text-xs uppercase tracking-widest font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-2 border-transparent px-6 py-2.5 rounded-lg transition-all shadow-glow-purple"
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
