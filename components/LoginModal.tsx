import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, Loader2, KeyRound } from "lucide-react";
import {
  getGoogleLoginErrorMessage,
  loginWithGoogle,
  auth,
} from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

export function LoginModal({
  isOpen,
  onClose,
  initialMode = "login",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
      setInfo("");
    }
  }, [isOpen, initialMode]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");
      await loginWithGoogle();
      handleClose();
    } catch (e: any) {
      setError(getGoogleLoginErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      handleClose();
    } catch (e: any) {
      setError(
        e.message ||
          "Authentication failed. Make sure Email/Password provider is enabled in Firebase Console.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your email first, then click Forgot password.");
      setInfo("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");
      await sendPasswordResetEmail(auth, normalizedEmail);
      setInfo("Password reset email sent. Check your inbox and spam folder.");
    } catch (e: any) {
      setError(e?.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("login");
    setEmail("");
    setPassword("");
    setError("");
    setInfo("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200/70"
        >
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 flex justify-between items-center text-white">
            <h2 className="text-xl font-display font-bold">
              {mode === "signup"
                ? "Create your account"
                : "Sign in to continue"}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8">
            <div className="mb-6 rounded-xl bg-slate-100 p-1.5 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setInfo("");
                }}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setInfo("");
                }}
                className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex flex-col gap-2">
                <span>{error}</span>
                {error.includes("enabled") && (
                  <span className="text-xs opacity-90">
                    To enable this, go to your{" "}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold"
                    >
                      Firebase Console
                    </a>
                    , Authentication &gt; Sign-in method, and toggle this
                    provider on.
                  </span>
                )}
              </div>
            )}

            {info && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100">
                {info}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold py-3 px-6 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="mt-4 text-sm font-semibold text-violet-700 hover:text-violet-800 hover:underline inline-flex items-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                Forgot password?
              </button>
            )}

            <div className="relative py-5 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">
                or continue with
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3 px-6 rounded-full transition-all hover:shadow-md disabled:opacity-50"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError("");
                  setInfo("");
                }}
                className="text-violet-700 font-bold hover:underline text-sm"
              >
                {mode === "signup"
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
