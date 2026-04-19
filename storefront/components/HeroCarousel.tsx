'use client';

import Link from 'next/link';

import Image from 'next/image';

export default function HeroCarousel() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-slate-900 overflow-hidden group">
      {/* Background Image Setup */}
      <Image 
        src="/images/carousel/carousel.webp" 
        alt="Hero Promotional Banner" 
        fill
        priority
        className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
      />
      
      {/* Text Overlay for realism */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/20">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-xl text-center">Conquer the Wild.</h2>
        <p className="text-xl md:text-2xl font-light mb-8 drop-shadow-lg text-emerald-100 text-center px-4">Ultralight gear for serious adventurers. Up to 40% off.</p>
        <Link href="/products" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl uppercase tracking-wider transition-all transform hover:-translate-y-1">
          Shop the Sale
        </Link>
      </div>

      {/* Left Arrow */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      {/* Right Arrow */}
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500/80 hover:bg-emerald-500 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
        <div className="w-3 h-3 rounded-full bg-white/50 cursor-pointer"></div>
        <div className="w-3 h-3 rounded-full bg-white/50 cursor-pointer"></div>
      </div>
    </div>
  );
}
