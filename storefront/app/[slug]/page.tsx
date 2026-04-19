import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductByIdentifier } from '../../lib/products';
import CategoryView from '../../components/CategoryView';
import ProductView from '../../components/ProductView';

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;

  // Try matching as a product first for rich titles
  const product = await getProductByIdentifier(params.slug);
  if (product) {
    return { title: `${product.name} | CtxCommerce` };
  }

  // Otherwise treat as a valid category segment
  return { title: `${params.slug.toUpperCase()} | CtxCommerce` };
}

export default async function TrafficControllerPage(props: { params: Params }) {
  const params = await props.params;
  const slug = params.slug;

  const allProducts = await getAllProducts();

  // 1. Is it a defined storefront category?
  const validCategories = [
    'tents', 'backpacks', 'sleepingbags-quilts', 
    'sleeping-pads', 'jackets', 'pants', 'shoes', 'equipment'
  ];
  
  if (validCategories.includes(slug)) {
    let categoryFilter = slug.replace('-', '_');
    
    // Explicit slug mapping normalizations
    if (slug === 'sleepingbags-quilts') categoryFilter = 'sleeping_bags';
    if (slug === 'sleeping-pads') categoryFilter = 'sleeping_pads';

    let filteredProducts = [];
    if (categoryFilter === 'equipment') {
      const gearFamilies = ['stoves', 'water_filters', 'outdoor_furniture', 'electronics', 'cookware', 'trekking_poles'];
      filteredProducts = allProducts.filter(p => gearFamilies.includes(p.family));
    } else {
      filteredProducts = allProducts.filter(p => p.family === categoryFilter);
    }

    if (filteredProducts.length === 0) {
      notFound();
    }
    
    return <CategoryView slug={slug} filteredProducts={filteredProducts} />;
  }

  // 2. Check if it strictly matches a valid Product Identifier within the PIM Database
  const product = await getProductByIdentifier(slug);
  if (product) {
    return <ProductView product={product} />;
  }

  // 3. Unrecognized structure
  notFound();
}
