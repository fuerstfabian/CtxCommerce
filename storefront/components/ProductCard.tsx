import Link from 'next/link';
import { PimProduct } from '../lib/products';

export default function ProductCard({ product }: { product: PimProduct }) {
  // Use a generic placeholder per user's request
  const fallbackImage = `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(product.name.split(" ")[0])}`;

  return (
    <Link href={`/product/${product.identifier}`} className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all h-full">
      <div className="relative h-48 w-full bg-slate-100 flex-shrink-0">
        <img 
          src={fallbackImage} 
          alt={product.name}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-slate-800 text-lg mb-1 leading-tight">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-2">{product.description}</p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="font-bold text-blue-600">€{product.price.toFixed(2)}</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{product.family}</span>
        </div>
      </div>
    </Link>
  );
}
