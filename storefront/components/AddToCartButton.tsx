'use client';

import { useState } from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
};

export default function AddToCartButton({ product }: { product: CartItem }) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    // 1. Read existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('ctx_cart') || '[]');
    
    // 2. Append new item
    existingCart.push(product);
    
    // 3. Save back
    localStorage.setItem('ctx_cart', JSON.stringify(existingCart));
    
    // 4. Dispatch a custom window event so HeaderCart.tsx updates immediately
    window.dispatchEvent(new Event('cartUpdated'));

    // 5. Visual State update
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <button 
      data-agent-id="cart-btn" 
      onClick={handleAddToCart}
      className={`font-semibold flex-1 py-4 px-8 rounded-xl transition-all duration-300 transform active:scale-95 ${
        added 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-xl'
      }`}
    >
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  );
}
