import fastify from "fastify";
import { InventoryRepository } from "./warehouse/inventory-repository.js";
import { PriceRepository } from "./pricing/price-repository.js";
import { CheckAvailability } from "./warehouse/check-availability.js";
import { registerWarehouseRoutes } from "./warehouse/routes.js";
import { registerPricingRoutes } from "./pricing/routes.js";

export function createApp() {
  const server = fastify({
    logger: false,
  });

  const inventoryRepository = new InventoryRepository();
  const priceRepository = new PriceRepository();
  const checkAvailability = new CheckAvailability(inventoryRepository);

  server.get("/health", async () => {
    return { status: "ok" };
  });

  registerWarehouseRoutes(server, inventoryRepository);
  registerPricingRoutes(server, priceRepository, checkAvailability);

  return { fastify: server };
}

async function start() {
  const { fastify: server } = createApp();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";

  await server.listen({ port, host });
  console.log(`Server is running on http://${host}:${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
