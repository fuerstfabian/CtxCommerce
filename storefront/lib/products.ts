import { promises as fs } from 'fs';
import path from 'path';

export interface PimProduct {
  uuid: string;
  identifier: string;
  enabled: boolean;
  family: string;
  categories: string[];
  name: string;
  description: string;
  price: number;
  currency: string;
  specs: Record<string, string | number>;
}

export async function getAllProducts(): Promise<PimProduct[]> {
  const filePath = path.join(process.cwd(), '../data/pim-synthetic-export.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const rawData = JSON.parse(fileContents);

  return rawData.map((item: any) => {
    // Determine specs mapping dynamically
    const specs: Record<string, string | number> = {};
    if (item.values.weight_grams?.[0]?.data !== undefined) {
      specs.Weight = `${item.values.weight_grams[0].data}g`;
    }
    if (item.values.capacity?.[0]?.data) {
      specs.Capacity = item.values.capacity[0].data;
    }
    if (item.values.color?.[0]?.data) {
      specs.Color = item.values.color[0].data;
    }
    if (item.values.r_value?.[0]?.data !== undefined) {
      specs['R-Value'] = item.values.r_value[0].data;
    }

    return {
      uuid: item.uuid,
      identifier: item.identifier,
      enabled: item.enabled ?? true,
      family: item.family,
      categories: item.categories || [],
      name: item.values.name?.[0]?.data || "Unknown Product",
      description: item.values.description?.[0]?.data || "",
      price: parseFloat(item.values.price?.[0]?.data?.[0]?.amount || "0"),
      currency: item.values.price?.[0]?.data?.[0]?.currency || "EUR",
      specs
    };
  });
}

export async function getProductByIdentifier(identifier: string): Promise<PimProduct | null> {
  const products = await getAllProducts();
  return products.find(p => p.identifier === identifier) || null;
}
