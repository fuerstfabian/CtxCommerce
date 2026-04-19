import { getAllProducts } from '../../lib/products';
import FilterableProductGrid from '../../components/FilterableProductGrid';
import { Suspense } from 'react';

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">All Gear</h1>
        <p className="text-slate-500 text-lg">Browse our complete collection of {products.length} premium ultralight items.</p>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading Product Filters...</div>}>
        <FilterableProductGrid initialProducts={products} />
      </Suspense>
    </div>
  );
}
