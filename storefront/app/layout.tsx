import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

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
        <link rel="stylesheet" href="/widget/widget.css" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-xl font-bold tracking-tight text-blue-600">CtxCommerce</a>
              <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button aria-label="Cart" className="p-2 text-slate-600 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <Script src="/widget/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
