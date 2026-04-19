import Link from 'next/link';
import { PimProduct } from '../lib/products';

import Image from 'next/image';

// Deterministic hashing assignment for product UI mappings
export function getDeterministicImage(product: PimProduct) {
  let prefix = product.family;
  
  // Prefix normalization mappings
  if (product.family === 'sleeping_pads') prefix = 'sleepingpad';
  else if (product.family === 'sleeping_bags') prefix = 'sleepingbag';
  else if (product.family === 'tents') prefix = 'tent';
  else if (product.family === 'backpacks') prefix = 'backpack';
  else if (['stoves', 'water_filters', 'outdoor_furniture', 'electronics', 'cookware', 'trekking_poles'].includes(product.family)) {
    prefix = 'equipment';
  }

  // Consistent string hashing 
  let hash = 0;
  for (let i = 0; i < product.identifier.length; i++) {
    hash = product.identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  // Dynamic modulo bounded to file quantities identified within /public/images/products/
  const maxImages = prefix === 'equipment' ? 5 : 3;
  const index = (hash % maxImages) + 1;

  return `/images/products/${prefix}-${index}.webp`;
}

export default function ProductCard({ product }: { product: PimProduct }) {
  const dynamicImageSrc = getDeterministicImage(product);

  return (
    <Link href={`/${product.identifier}`} className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all h-full">
      <div className="relative w-full aspect-[3/4] bg-slate-100 flex-shrink-0">
        <Image 
          src={dynamicImageSrc} 
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-slate-800 text-lg mb-1 leading-tight">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-2">{product.description}</p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="font-bold text-blue-600">€{product.price.toFixed(2)}</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{product.family.replace('_', ' ')}</span>
        </div>
      </div>
    </Link>
  );
}
