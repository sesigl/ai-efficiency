import Fastify from "fastify";
import { createWarehouseContainer } from "./modules/warehouse/index.js";
import { createPricingContainer } from "./modules/pricing/index.js";
import { registerWarehouseRoutes } from "./api/warehouse.routes.js";
import { registerPricingRoutes } from "./api/pricing.routes.js";

export function createApp() {
  const fastify = Fastify({
    logger: true,
  });

  const warehouseContainer = createWarehouseContainer();
  const pricingContainer = createPricingContainer((sku: string) =>
    warehouseContainer.getAvailability.execute({ sku }),
  );

  registerWarehouseRoutes(fastify, warehouseContainer);
  registerPricingRoutes(fastify, pricingContainer);

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  return { fastify, warehouseContainer, pricingContainer };
}

async function main() {
  const { fastify } = createApp();

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
