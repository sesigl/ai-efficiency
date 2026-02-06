import type { FastifyInstance } from "fastify";
import type { CatalogUseCases } from "../modules/catalog/infrastructure/di.js";

export function registerProductRoutes(
  fastify: FastifyInstance,
  catalogUseCases: CatalogUseCases,
): void {
  // Catalog: Register a product
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
    try {
      const product = catalogUseCases.products.registerProduct({
        name: request.body.name,
        description: request.body.description,
        category: request.body.category,
        brand: request.body.brand,
        unitOfMeasure: request.body.unitOfMeasure,
        barcode: request.body.barcode,
      });
      return reply.code(201).send(product);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Catalog: Search products by category
  fastify.get<{
    Querystring: { category?: string };
  }>("/products", async (request, reply) => {
    if (!request.query.category) {
      return reply.code(400).send({ error: "Category query parameter is required" });
    }

    const products = catalogUseCases.products.searchByCategory({
      category: request.query.category,
    });
    return reply.send(products);
  });
}
