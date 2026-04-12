'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeaderCart() {
  const [itemCount, setItemCount] = useState(0);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('ctx_cart') || '[]');
    setItemCount(cart.length);
  };

  useEffect(() => {
    // Initial load
    updateCartCount();

    // Listen for custom event from AddToCartButton and Cart removals
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  return (
    <Link href="/cart" aria-label="Cart" className="p-2 text-slate-600 hover:text-emerald-600 relative flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
