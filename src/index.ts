import Fastify from "fastify";
import { createWarehouseUseCases } from "./modules/warehouse/di.js";
import { createPricingUseCases } from "./modules/pricing/di.js";
import { registerWarehouseRoutes } from "./api/warehouse.routes.js";
import { registerPricingRoutes } from "./api/pricing.routes.js";

export function createApp() {
  const fastify = Fastify({
    logger: true,
  });

  const warehouseUseCases = createWarehouseUseCases();
  const pricingUseCases = createPricingUseCases((sku: string) =>
    warehouseUseCases.getAvailability.execute({ sku }),
  );

  registerWarehouseRoutes(fastify, warehouseUseCases);
  registerPricingRoutes(fastify, pricingUseCases);

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  return { fastify, warehouseUseCases, pricingUseCases };
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
