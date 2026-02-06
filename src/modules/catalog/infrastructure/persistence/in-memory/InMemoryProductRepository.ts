import type { Category } from "../../../domain/product/Category.js";
import type { Product } from "../../../domain/product/Product.js";
import type { ProductRepository } from "../../../domain/product/ProductRepository.js";
import type { SKU } from "../../../domain/product/Sku.js";

export class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();
  private sequence = 0;

  findBySku(sku: SKU): Product | undefined {
    return this.products.get(sku.toString());
  }

  findByCategory(category: Category): Product[] {
    return Array.from(this.products.values()).filter((product) =>
      product.getCategory().equals(category),
    );
  }

  save(product: Product): void {
    this.products.set(product.getSku().toString(), product);
  }

  nextSequence(): number {
    this.sequence++;
    return this.sequence;
  }

  clear(): void {
    this.products.clear();
    this.sequence = 0;
  }
}
