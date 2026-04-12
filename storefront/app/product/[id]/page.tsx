import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getProductByIdentifier } from '../../../lib/products';
import AddToCartButton from '../../../components/AddToCartButton';

type Params = Promise<{ id: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductByIdentifier(params.id);
  if (!product) return { title: 'Product Not Found' };
  return { title: `${product.name} | CtxCommerce` };
}

export default async function ProductPage(props: { params: Params }) {
  const params = await props.params;
  const product = await getProductByIdentifier(params.id);

  if (!product) notFound();

  // Construct standard Schema.org JSON-LD for DOM scanning
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

  const fallbackImage = `https://placehold.co/800x600/e2e8f0/475569?text=${encodeURIComponent(product.name.split(" ")[0])}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <Script id="product-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
        <div className="lg:w-1/2">
          <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
            <img src={fallbackImage} alt={product.name} className="w-full object-cover h-auto" />
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
