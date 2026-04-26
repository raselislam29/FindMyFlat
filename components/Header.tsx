'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Home, PlusCircle, MessageCircle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export function Header({ onPostClick }: { onPostClick?: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { user, login, logout, loading } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-indigo-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 text-slate-800 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white p-2.5 rounded-2xl shadow-md rotate-3 hover:rotate-0 transition-transform">
                <Home className="h-6 w-6" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                {t('appTitle')}
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center bg-indigo-50/50 rounded-full p-1 border border-indigo-100">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all ${
                  language === 'bn' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all ${
                  language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                EN
              </button>
            </div>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-chats'))}
                      className="text-slate-500 hover:text-pink-500 transition-colors p-2"
                      title="Messages"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </button>
                    <button
                      onClick={onPostClick}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline uppercase tracking-widest text-[11px]">{t('postRental')}</span>
                    </button>
                    
                    <div className="relative group">
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                          alt="User" 
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100 p-2">
                        <Link 
                          href="/dashboard"
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium flex items-center gap-2 mb-1"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <button 
                          onClick={logout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-medium flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-login', { detail: { mode: 'login' } }))}
                      className="text-xs uppercase tracking-widest font-bold text-slate-600 hover:text-indigo-600 px-4 py-2.5 transition-colors"
                    >
                      {t('signIn')}
                    </button>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-login', { detail: { mode: 'signup' } }))}
                      className="text-xs uppercase tracking-widest font-bold text-indigo-600 hover:text-white border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-600 px-6 py-2.5 rounded-full transition-all"
                    >
                      {t('signUp')}
                    </button>
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
