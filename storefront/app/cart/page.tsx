'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CartItem = {
  id: string;
  name: string;
  price: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkedOut, setCheckedOut] = useState(false);

  useEffect(() => {
    // Load cart on client side
    const savedCart = JSON.parse(localStorage.getItem('ctx_cart') || '[]');
    setCart(savedCart);
  }, []);

  const handleRemove = (indexToRemove: number) => {
    const updatedCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(updatedCart);
    localStorage.setItem('ctx_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleCheckout = () => {
    localStorage.setItem('ctx_cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
    setCart([]);
    setCheckedOut(true);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  if (checkedOut) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <div className="bg-emerald-50 text-emerald-800 rounded-3xl p-12 shadow-sm border border-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-emerald-500 mb-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          <h1 className="text-4xl font-extrabold mb-4">Thank you!</h1>
          <p className="text-lg mb-8">Your test order has been successfully placed. The UX AI Agent successfully executed the checkout flow.</p>
          <Link href="/products" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-full transition-colors">
            Continue Testing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-8">Your Cart</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl">
          <p className="text-slate-500 text-lg mb-6">Your cart is currently empty.</p>
          <Link href="/products" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full transition-colors">
            Browse Gear
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Table */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {cart.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="p-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{item.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 font-mono">{item.id}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-lg text-slate-800">€{item.price.toFixed(2)}</span>
                      <button 
                        onClick={() => handleRemove(index)}
                        className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-slate-600 border-b border-slate-200 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
              </div>
              
              <div className="flex justify-between font-extrabold text-2xl text-slate-900 mb-8">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              
              <button 
                data-agent-id="checkout-btn"
                onClick={handleCheckout}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform transform active:scale-95"
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
