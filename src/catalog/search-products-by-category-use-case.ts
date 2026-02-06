import type { CatalogRepository } from "./catalog-repository.js";
import type { Product } from "./product.js";

export class SearchProductsByCategoryUseCase {
  constructor(private catalogRepository: CatalogRepository) {}

  execute(category: string): Product[] {
    return this.catalogRepository.findByCategory(category);
  }
}
