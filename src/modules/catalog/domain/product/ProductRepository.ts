import type { Category } from "./Category.js";
import type { Product } from "./Product.js";
import type { SKU } from "./Sku.js";

export interface ProductRepository {
  findBySku(sku: SKU): Product | undefined;
  findByCategory(category: Category): Product[];
  save(product: Product): void;
  nextSequence(): number;
}
