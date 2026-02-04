import type { FastifyInstance } from "fastify";
import type { WarehouseContainer } from "../modules/warehouse/index.js";

export function registerWarehouseRoutes(
  fastify: FastifyInstance,
  container: WarehouseContainer,
): void {
  fastify.post<{
    Body: { sku: string; quantity: number };
  }>("/warehouse/stock/add", async (request, reply) => {
    try {
      container.addStock.execute(request.body);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.post<{
    Body: { sku: string; quantity: number };
  }>("/warehouse/stock/remove", async (request, reply) => {
    try {
      container.removeStock.execute(request.body);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.post<{
    Body: { sku: string; reservationId: string; quantity: number; expiresAt: string };
  }>("/warehouse/reservations", async (request, reply) => {
    try {
      const result = container.reserveStock.execute({
        ...request.body,
        expiresAt: new Date(request.body.expiresAt),
      });
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.delete<{
    Params: { sku: string; reservationId: string };
  }>("/warehouse/reservations/:sku/:reservationId", async (request, reply) => {
    try {
      container.releaseReservation.execute({
        sku: request.params.sku,
        reservationId: request.params.reservationId,
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.get<{
    Params: { sku: string };
  }>("/warehouse/inventory/:sku", async (request, reply) => {
    const item = container.getInventoryItem.execute({ sku: request.params.sku });
    if (!item) {
      return reply.code(404).send({ error: "Inventory item not found" });
    }
    return reply.send(item);
  });

  fastify.get<{
    Params: { sku: string };
  }>("/warehouse/availability/:sku", async (request, reply) => {
    const availability = container.getAvailability.execute({ sku: request.params.sku });
    return reply.send(availability);
  });
}
