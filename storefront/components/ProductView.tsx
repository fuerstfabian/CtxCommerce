import Script from 'next/script';
import Image from 'next/image';
import { PimProduct } from '../lib/products';
import AddToCartButton from './AddToCartButton';
import { getDeterministicImage } from './ProductCard';

export default function ProductView({ product }: { product: PimProduct }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
    },
    productID: product.identifier,
  };

  const dynamicImageSrc = getDeterministicImage(product);

  const formatFamilySlug = (fam: string) => {
    if (fam === 'sleeping_bags') return 'sleepingbags-quilts';
    if (fam === 'sleeping_pads') return 'sleeping-pads';
    if (['stoves', 'water_filters', 'outdoor_furniture', 'electronics', 'cookware', 'trekking_poles'].includes(fam)) return 'equipment';
    return fam.replace('_', '-');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Script id={`product-json-ld-${product.identifier}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Breadcrumbs */}
      <nav className="text-sm font-medium text-slate-500 mb-8 flex items-center gap-2">
        <a href="/" className="hover:text-emerald-600 transition-colors">Home</a>
        <span className="text-slate-300">/</span>
        <a href={`/${formatFamilySlug(product.family)}`} className="hover:text-emerald-600 transition-colors capitalize">
          {formatFamilySlug(product.family).replace('-', ' ')}
        </a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 line-clamp-1">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
        <div className="lg:w-1/2">
          <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative aspect-[3/4] w-full">
            <Image 
              src={dynamicImageSrc} 
              alt={product.name} 
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover w-full h-full" 
            />
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-6">€{product.price.toFixed(2)}</p>
          
          <div className="prose prose-slate max-w-none mb-10">
            <p className="text-lg leading-relaxed text-slate-600">{product.description}</p>
          </div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Specifications</h3>
              <ul className="divide-y divide-slate-200 border-t border-slate-200">
                {Object.entries(product.specs).map(([key, value]) => (
                  <li key={key} className="py-3 flex justify-between">
                    <span className="text-slate-500">{key}</span>
                    <span className="font-medium text-slate-900 text-right">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-auto flex gap-4">
            <AddToCartButton product={{ id: product.identifier, name: product.name, price: product.price }} />
          </div>
        </div>
      </div>
    </div>
  );
}
