import { Product } from "./product.js";
import type { InMemoryCatalogRepository } from "./catalog-repository.js";

export class RegisterProductUseCase {
  constructor(private catalogRepository: InMemoryCatalogRepository) {}

  execute(attributes: {
    name: string;
    description: string;
    category: string;
    brand: string;
    unitOfMeasure: string;
    barcode: string;
  }): Product {
    const sku = this.catalogRepository.nextSku();
    const product = new Product(
      sku,
      attributes.name,
      attributes.description,
      attributes.category,
      attributes.brand,
      attributes.unitOfMeasure,
      attributes.barcode,
    );
    this.catalogRepository.save(product);
    return product;
  }
}
