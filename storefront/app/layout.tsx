import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Link from 'next/link';
import './globals.css';
import HeaderCart from '../components/HeaderCart';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CtxCommerce | AI Powered E-Commerce',
  description: 'Realistic mock storefront for CtxCommerce AI Agent testing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="text-2xl font-extrabold tracking-tight text-emerald-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
                CtxCommerce
              </a>
            </div>

            {/* Dummy Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search for tents, backpacks, sleeping bags..." 
                  className="w-full bg-slate-100 border border-slate-300 text-slate-800 text-sm rounded-full focus:ring-emerald-500 focus:border-emerald-500 block pl-4 pr-10 py-2.5"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>

            {/* Cart & Profile */}
            <div className="flex items-center gap-4">
              <button aria-label="Profile" className="p-2 text-slate-600 hover:text-emerald-600 hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              <HeaderCart />
            </div>
          </div>
          
          {/* CATEGORY NAV BAR */}
          <div className="bg-slate-800 w-full hidden md:block border-b border-emerald-500">
            <div className="container mx-auto px-4 h-12 flex items-center justify-center">
              <nav className="flex items-center gap-8 text-sm font-semibold text-slate-300">
                <Link href="/tents" className="hover:text-white transition-colors">Tents</Link>
                <Link href="/backpacks" className="hover:text-white transition-colors">Backpacks</Link>
                <Link href="/sleeping-pads" className="hover:text-white transition-colors">Sleeping Pads</Link>
                <Link href="/sleepingbags-quilts" className="hover:text-white transition-colors">Sleepingbags/Quilts</Link>
                <Link href="/jackets" className="hover:text-white transition-colors">Jackets</Link>
                <Link href="/pants" className="hover:text-white transition-colors">Pants</Link>
                <Link href="/shoes" className="hover:text-white transition-colors">Shoes</Link>
                <Link href="/equipment" className="hover:text-white transition-colors">Equipment</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col items-center">
          {children}
        </main>

        <footer className="bg-slate-900 text-slate-400 py-12 mt-20 w-full">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} CtxCommerce. Authentic Outdoor Experience Mock.</p>
          </div>
        </footer>

        <Script src="/widget/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
