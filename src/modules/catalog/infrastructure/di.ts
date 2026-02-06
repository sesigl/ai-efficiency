import { ProductUseCases } from "../application/product/ProductUseCases.js";
import type { ProductRepository } from "../domain/product/ProductRepository.js";
import { InMemoryProductRepository } from "./persistence/in-memory/InMemoryProductRepository.js";

export interface CatalogUseCases {
  repository: ProductRepository;
  products: ProductUseCases;
}

export function createCatalogUseCases(repository?: ProductRepository): CatalogUseCases {
  const repo = repository ?? new InMemoryProductRepository();

  return {
    repository: repo,
    products: new ProductUseCases(repo),
  };
}
