import Script from 'next/script';
import FilterableProductGrid from './FilterableProductGrid';
import { PimProduct } from '../lib/products';
import { Suspense } from 'react';

export default function CategoryView({ slug, filteredProducts }: { slug: string; filteredProducts: PimProduct[] }) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredProducts.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.currency,
        },
        url: `http://localhost:3000/${product.identifier}`
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Script id={`category-json-ld-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Breadcrumbs */}
      <nav className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-emerald-600 transition-colors">Home</a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900">{capitalize(slug)}</span>
      </nav>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Our {capitalize(slug)}</h1>
        <p className="text-slate-500 text-lg">Found {filteredProducts.length} high-performance items in this category.</p>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading Product Filters...</div>}>
        <FilterableProductGrid initialProducts={filteredProducts} />
      </Suspense>
    </div>
  );
}
