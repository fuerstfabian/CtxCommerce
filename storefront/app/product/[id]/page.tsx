import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';

const MOCK_DB = {
  'nemo-hornet-osmo-2': {
    id: 'nemo-hornet-osmo-2',
    name: 'Nemo Hornet Osmo 2P',
    description: 'Ultra-lightweight freestanding backpacking tent. Features the new OSMO poly-nylon ripstop fabric that reduces stretch when wet. Minimum weight is only 948g. Perfect for thru-hiking.',
    price: 429.95,
    currency: 'EUR',
    specs: { Weight: '948g', Capacity: '2 Person' }
  },
  'thermarest-neoair-xLite-nxt': {
    id: 'thermarest-neoair-xLite-nxt',
    name: 'Therm-a-Rest NeoAir XLite NXT',
    description: 'The gold standard in ultralight backpacking sleeping pads. The NXT version is significantly quieter and thicker (3 inches) with an R-Value of 4.5. Weighs only 354g in regular size.',
    price: 209.95,
    currency: 'EUR',
    specs: { Weight: '354g', 'R-Value': '4.5' }
  }
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = MOCK_DB[resolvedParams.id as keyof typeof MOCK_DB];
  if (!product) return { title: 'Product Not Found' };
  return { title: `${product.name} | CtxCommerce` };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = MOCK_DB[resolvedParams.id as keyof typeof MOCK_DB];

  if (!product) notFound();

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
    productID: product.id,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Script id="product-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{product.name}</h1>
        <p className="text-2xl text-blue-600 mb-6">€{product.price}</p>
        <p className="text-slate-600 mb-8">{product.description}</p>
        
        <button data-agent-id="cart-btn" className="bg-blue-600 text-white font-semibold flex-1 py-4 px-8 rounded-xl">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
