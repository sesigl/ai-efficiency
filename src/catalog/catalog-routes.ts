import type { FastifyInstance } from "fastify";
import type { InMemoryCatalogRepository } from "./catalog-repository.js";
import { RegisterProductUseCase } from "./register-product-use-case.js";
import { SearchProductsByCategoryUseCase } from "./search-products-by-category-use-case.js";

export function registerCatalogRoutes(
  fastify: FastifyInstance,
  catalogRepository: InMemoryCatalogRepository,
) {
  const registerProductUseCase = new RegisterProductUseCase(catalogRepository);
  const searchProductsByCategoryUseCase = new SearchProductsByCategoryUseCase(catalogRepository);

  fastify.post<{
    Body: {
      name: string;
      description: string;
      category: string;
      brand: string;
      unitOfMeasure: string;
      barcode: string;
    };
  }>("/products", async (request, reply) => {
    const product = registerProductUseCase.execute(request.body);

    return reply.code(201).send(product);
  });

  fastify.get<{
    Querystring: { category?: string };
  }>("/products", async (request, reply) => {
    const { category } = request.query;

    if (!category) {
      return reply.code(200).send([]);
    }

    const products = searchProductsByCategoryUseCase.execute(category);

    return reply.code(200).send(products);
  });
}
