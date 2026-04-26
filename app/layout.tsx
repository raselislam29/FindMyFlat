import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'FindMyFlat - Modern NYC Rentals',
  description: 'A modern bilingual web application for posting and searching house rentals.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning className="bg-[#f8f9ff] text-slate-800 font-sans antialiased min-h-screen selection:bg-pink-200 selection:text-pink-900">
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60 mix-blend-multiply" 
             style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.15) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.1) 0%, transparent 60%)' }}>
        </div>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
