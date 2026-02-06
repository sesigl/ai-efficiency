import Fastify from "fastify";
import { registerItemRoutes } from "./api/items.routes.js";
import { createAppDependencies } from "./di.js";

export function createApp() {
  const fastify = Fastify({
    logger: true,
  });

  const { warehouseUseCases, pricingUseCases } = createAppDependencies();

  registerItemRoutes(fastify, warehouseUseCases, pricingUseCases);

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
