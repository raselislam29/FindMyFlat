import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, ChevronLeft, MoveRight } from 'lucide-react';
import { loginWithGoogle, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export function LoginModal({ isOpen, onClose, initialMode = 'login' }: { isOpen: boolean; onClose: () => void; initialMode?: 'login' | 'signup' }) {
  const [method, setMethod] = useState<'options' | 'email'>('options');
  const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMethod('options');
      setIsRegistering(initialMode === 'signup');
      setError('');
    }
  }, [isOpen, initialMode]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to login with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Make sure Email/Password provider is enabled in Firebase Console.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMethod('options');
    setIsRegistering(false);
    setEmail('');
    setPassword('');
    setError('');
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
        >
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 flex justify-between items-center text-white">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              {method !== 'options' && (
                <button onClick={() => { setMethod('options'); setError(''); }} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {isRegistering ? 'Create an account' : 'Welcome back'}
            </h2>
            <button onClick={handleClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex flex-col gap-2">
                <span>{error}</span>
                {error.includes('enabled') && (
                  <span className="text-xs opacity-90">
                    To enable this, go to your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a>, Authentication &gt; Sign-in method, and toggle this provider on.
                  </span>
                )}
              </div>
            )}

            {method === 'options' && (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3 px-6 rounded-full transition-all hover:shadow-md disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
                
                <div className="relative py-3 flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or connect with</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                  onClick={() => setMethod('email')}
                  className="w-full flex items-center justify-between bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold py-3 px-6 rounded-full transition-all border border-violet-100"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 opacity-70" />
                    Email and Password
                  </div>
                  <MoveRight className="h-5 w-5 opacity-50" />
                </button>
              </div>
            )}

            {method === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold py-3 px-6 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4"
                >
                  {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
                </button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-violet-600 font-bold hover:underline text-sm">
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
