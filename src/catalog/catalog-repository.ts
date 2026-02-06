import type { Product } from "./product.js";

export interface CatalogRepository {
  save(product: Product): void;
  findByCategory(category: string): Product[];
}

export class InMemoryCatalogRepository implements CatalogRepository {
  private products: Product[] = [];
  private skuCounter = 0;

  save(product: Product): void {
    this.products.push(product);
  }

  findByCategory(category: string): Product[] {
    return this.products.filter((p) => p.category === category);
  }

  nextSku(): string {
    this.skuCounter++;
    return `PROD-${String(this.skuCounter).padStart(6, "0")}`;
  }
}
