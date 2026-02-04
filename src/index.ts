import Fastify from "fastify";
import { registerWarehouseRoutes } from "./api/warehouse.routes.js";
import { registerPricingRoutes } from "./api/pricing.routes.js";
import { createAppDependencies } from "./di.js";

export function createApp() {
  const fastify = Fastify({
    logger: true,
  });

  const { warehouseUseCases, pricingUseCases } = createAppDependencies();

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
