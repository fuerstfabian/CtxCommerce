import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getAllProducts } from '../../../lib/products';
import ProductCard from '../../../components/ProductCard';

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  return { title: `${params.slug.toUpperCase()} | CtxCommerce` };
}

export default async function CategoryPage(props: { params: Params }) {
  const params = await props.params;
  const allProducts = await getAllProducts();
  
  const categoryFilter = params.slug.replace('-', '_');
  
  let filteredProducts = [];

  // Special case for 'gear' which acts as a catch-all for various equipment families
  if (categoryFilter === 'gear') {
    const gearFamilies = ['stoves', 'water_filters', 'outdoor_furniture', 'electronics', 'cookware', 'trekking_poles'];
    filteredProducts = allProducts.filter(p => gearFamilies.includes(p.family));
  } else {
    filteredProducts = allProducts.filter(p => p.family === categoryFilter);
  }

  if (filteredProducts.length === 0) {
    notFound();
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

  // Schema.org ItemList for DOM AI scanning 
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
        url: `http://localhost:3000/product/${product.identifier}`
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Script id="category-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Breadcrumbs */}
      <nav className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-emerald-600 transition-colors">Home</a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900">{capitalize(params.slug)}</span>
      </nav>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Our {capitalize(params.slug)}</h1>
        <p className="text-slate-500 text-lg">Found {filteredProducts.length} high-performance items in this category.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.uuid} product={product} />
        ))}
      </div>
    </div>
  );
}
