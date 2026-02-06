import fastify from "fastify";
import { InMemoryInventoryRepository } from "./inventory/inventory-repository.js";
import { InMemoryPricingRepository } from "./pricing/pricing-repository.js";
import { registerInventoryRoutes } from "./inventory/inventory-routes.js";
import { registerPricingRoutes } from "./pricing/pricing-routes.js";
import { InMemoryCatalogRepository } from "./catalog/catalog-repository.js";
import { registerCatalogRoutes } from "./catalog/catalog-routes.js";

export function createApp() {
  const server = fastify({
    logger: true,
  });

  const inventoryRepository = new InMemoryInventoryRepository();
  const pricingRepository = new InMemoryPricingRepository();
  const catalogRepository = new InMemoryCatalogRepository();

  server.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });

  registerInventoryRoutes(server, inventoryRepository);
  registerPricingRoutes(server, pricingRepository, inventoryRepository);
  registerCatalogRoutes(server, catalogRepository);

  return { fastify: server };
}

const start = async () => {
  try {
    const { fastify: server } = createApp();
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
