import { getAllProducts } from '../lib/products';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import Link from 'next/link';

export default async function Home() {
  const products = await getAllProducts();

  // Grab the first 8 products (or you could shuffle them) to represent our "Best Sellers"
  const popularProducts = products.slice(0, 8);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. Hero Carousel placed at the very top (full width) */}
      <HeroCarousel />

      {/* 2. Popular Products Section */}
      <div className="container mx-auto px-4 py-16">
        
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">Popular Products</h2>
            <p className="text-slate-500">Handpicked ultralight essentials for your next adventure.</p>
          </div>
          <Link href="/products" className="hidden md:inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 mt-4 md:mt-0">
            View all gear
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>

        {/* 4 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularProducts.map((product) => (
            <ProductCard key={product.uuid} product={product} />
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
          <Link href="/products" className="inline-block bg-white text-slate-800 border border-slate-300 font-medium py-3 px-8 rounded-full hover:bg-slate-50 transition-colors w-full">
            View all gear
          </Link>
        </div>

      </div>

    </div>
  );
}
