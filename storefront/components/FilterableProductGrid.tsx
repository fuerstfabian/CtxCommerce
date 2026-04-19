'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProductCard from './ProductCard';
import { PimProduct } from '../lib/products';

export default function FilterableProductGrid({ initialProducts }: { initialProducts: PimProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 1. Calculate Absolute Boundaries from initial dataset
  const absMinPrice = useMemo(() => {
    if (initialProducts.length === 0) return 0;
    return Math.floor(Math.min(...initialProducts.map(p => p.price)));
  }, [initialProducts]);
  
  const absMaxPrice = useMemo(() => {
    if (initialProducts.length === 0) return 1000;
    return Math.ceil(Math.max(...initialProducts.map(p => p.price)));
  }, [initialProducts]);
  
  const absMinWeight = useMemo(() => {
    if (initialProducts.length === 0) return 0;
    const weights = initialProducts.map(p => parseInt(String(p.specs?.Weight || '0').replace(/[^0-9.]/g, '')));
    return Math.floor(Math.min(...weights));
  }, [initialProducts]);
  
  const absMaxWeight = useMemo(() => {
    if (initialProducts.length === 0) return 5000;
    const weights = initialProducts.map(p => parseInt(String(p.specs?.Weight || '0').replace(/[^0-9.]/g, '')));
    return Math.ceil(Math.max(...weights));
  }, [initialProducts]);

  // 2. Parse URL Parameters (Source of Truth)
  // If param exists, parse it. Otherwise defualt to the calculated absolute limits.
  const urlMinPrice = searchParams.has('minPrice') ? parseInt(searchParams.get('minPrice')!) : absMinPrice;
  const urlMaxPrice = searchParams.has('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : absMaxPrice;
  const urlMinWeight = searchParams.has('minWeight') ? parseInt(searchParams.get('minWeight')!) : absMinWeight;
  const urlMaxWeight = searchParams.has('maxWeight') ? parseInt(searchParams.get('maxWeight')!) : absMaxWeight;
  const urlColors = searchParams.get('colors') ? searchParams.get('colors')!.split(',') : [];

  // Local View State (for fluid typing)
  const [localMinPrice, setLocalMinPrice] = useState(urlMinPrice.toString());
  const [localMaxPrice, setLocalMaxPrice] = useState(urlMaxPrice.toString());
  const [localMinWeight, setLocalMinWeight] = useState(urlMinWeight.toString());
  const [localMaxWeight, setLocalMaxWeight] = useState(urlMaxWeight.toString());

  // Synchronize local typing state from URL instantly if the agent triggers it natively
  useEffect(() => {
    setLocalMinPrice(urlMinPrice.toString());
    setLocalMaxPrice(urlMaxPrice.toString());
    setLocalMinWeight(urlMinWeight.toString());
    setLocalMaxWeight(urlMaxWeight.toString());
  }, [urlMinPrice, urlMaxPrice, urlMinWeight, urlMaxWeight]);

  // Push updates to URL on BLUR or Debounce
  const applyFilterParams = useCallback((minP: string, maxP: string, minW: string, maxW: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    const pMin = parseInt(minP);
    const pMax = parseInt(maxP);
    const wMin = parseInt(minW);
    const wMax = parseInt(maxW);

    if (!isNaN(pMin) && pMin > absMinPrice) params.set('minPrice', pMin.toString()); else params.delete('minPrice');
    if (!isNaN(pMax) && pMax < absMaxPrice) params.set('maxPrice', pMax.toString()); else params.delete('maxPrice');
    if (!isNaN(wMin) && wMin > absMinWeight) params.set('minWeight', wMin.toString()); else params.delete('minWeight');
    if (!isNaN(wMax) && wMax < absMaxWeight) params.set('maxWeight', wMax.toString()); else params.delete('maxWeight');
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router, absMinPrice, absMaxPrice, absMinWeight, absMaxWeight]);

  // Fire onBlur natively
  const handleBlur = () => {
    applyFilterParams(localMinPrice, localMaxPrice, localMinWeight, localMaxWeight);
  };

  // Keyboard shortcut (Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilterParams(localMinPrice, localMaxPrice, localMinWeight, localMaxWeight);
    }
  };

  // Filter Logic natively reading the URL Source of truth bounds
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      // Price Validation
      if (p.price < urlMinPrice || p.price > urlMaxPrice) return false;
      
      // Weight Validation
      const productWeightRaw = String(p.specs?.Weight || '0').replace(/[^0-9.]/g, '');
      const productWeight = parseInt(productWeightRaw || '0');
      // Apply weight check. 
      if (productWeight < urlMinWeight || productWeight > urlMaxWeight) return false;

      // Color Validation
      if (urlColors.length > 0) {
        const productColors = String(p.specs?.Color || '').split('/').map(c => c.trim().toLowerCase());
        const hasMatch = urlColors.some(uc => productColors.includes(uc.toLowerCase()));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [initialProducts, urlMinPrice, urlMaxPrice, urlMinWeight, urlMaxWeight, urlColors]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    initialProducts.forEach(p => {
      if (p.specs?.Color) {
        String(p.specs.Color).split('/').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) colors.add(trimmed);
        });
      }
    });
    return Array.from(colors).sort();
  }, [initialProducts]);

  const toggleColor = (color: string) => {
    const isActive = urlColors.includes(color);
    let newColors = [...urlColors];
    if (isActive) {
      newColors = newColors.filter(c => c !== color);
    } else {
      newColors.push(color);
    }
    
    const params = new URLSearchParams(searchParams.toString());
    if (newColors.length > 0) {
      params.set('colors', newColors.join(','));
    } else {
      params.delete('colors');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters = searchParams.has('minPrice') || searchParams.has('maxPrice') || searchParams.has('minWeight') || searchParams.has('maxWeight') || searchParams.has('colors');

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Sidebar Filter Panel */}
      <aside className="w-full lg:w-[320px] flex-shrink-0 bg-white p-6 rounded-3xl border border-slate-200 h-fit lg:sticky lg:top-24 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filters
          </h2>
          {hasActiveFilters && (
             <button onClick={() => router.replace(pathname, {scroll: false})} className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors">Clear All</button>
          )}
        </div>

        {/* Price Numeric Inputs */}
        <div className="mb-8" data-filter-type="price">
          <label className="font-semibold text-slate-800 block mb-3">Price Range (€)</label>
          <div className="flex items-center gap-3">
            <input 
              type="number"
              placeholder={`Min: ${absMinPrice}`}
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
              aria-label="Minimum Price"
            />
            <span className="text-slate-400 font-medium">-</span>
            <input 
              type="number"
              placeholder={`Max: ${absMaxPrice}`}
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
              aria-label="Maximum Price"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Available: {absMinPrice}€ - {absMaxPrice}€</p>
        </div>
        
        {/* Weight Numeric Inputs */}
        <div className="mb-8" data-filter-type="weight">
          <label className="font-semibold text-slate-800 block mb-3">Weight Range (g)</label>
          <div className="flex items-center gap-3">
            <input 
              type="number"
              placeholder={`Min: ${absMinWeight}`}
              value={localMinWeight}
              onChange={(e) => setLocalMinWeight(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
              aria-label="Minimum Weight"
            />
            <span className="text-slate-400 font-medium">-</span>
            <input 
              type="number"
              placeholder={`Max: ${absMaxWeight}`}
              value={localMaxWeight}
              onChange={(e) => setLocalMaxWeight(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
              aria-label="Maximum Weight"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Available: {absMinWeight}g - {absMaxWeight}g</p>
        </div>

        {/* Color Toggles */}
        {availableColors.length > 0 && (
          <div className="mb-4" data-filter-type="colors">
            <label className="font-semibold text-slate-800 block mb-4">Color Palette</label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => {
                const isSelected = urlColors.includes(color);
                return (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Main Product Grid Floor */}
      <section className="flex-1">
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-600 font-medium">Viewing <strong className="text-slate-900">{filteredProducts.length}</strong> matching products</p>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
             <p className="text-slate-500 mb-6">Your current filter boundaries are too restrictive.</p>
             <button onClick={() => router.replace(pathname, {scroll: false})} className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-slate-800 transition-colors">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.uuid} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
