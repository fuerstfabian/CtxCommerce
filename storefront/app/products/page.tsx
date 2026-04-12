import { getAllProducts } from '../../lib/products';
import ProductCard from '../../components/ProductCard';

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">All Gear</h1>
        <p className="text-slate-500 text-lg">Browse our complete collection of {products.length} premium ultralight items.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.uuid} product={product} />
        ))}
      </div>
    </div>
  );
}
