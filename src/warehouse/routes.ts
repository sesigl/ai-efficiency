import type { FastifyInstance } from "fastify";
import { InventoryRepository } from "./inventory-repository.js";
import { AddStock } from "./add-stock.js";
import { RemoveStock } from "./remove-stock.js";
import { CreateReservation } from "./create-reservation.js";
import { ReleaseReservation } from "./release-reservation.js";
import { GetInventory } from "./get-inventory.js";
import { CheckAvailability } from "./check-availability.js";

export function registerWarehouseRoutes(
  fastify: FastifyInstance,
  repository: InventoryRepository,
): void {
  const addStock = new AddStock(repository);
  const removeStock = new RemoveStock(repository);
  const createReservation = new CreateReservation(repository);
  const releaseReservation = new ReleaseReservation(repository);
  const getInventory = new GetInventory(repository);
  const checkAvailability = new CheckAvailability(repository);

  fastify.post<{ Body: { sku: string; quantity: number } }>(
    "/warehouse/stock/add",
    async (request, reply) => {
      try {
        const { sku, quantity } = request.body;
        addStock.execute(sku, quantity);
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.post<{ Body: { sku: string; quantity: number } }>(
    "/warehouse/stock/remove",
    async (request, reply) => {
      try {
        const { sku, quantity } = request.body;
        removeStock.execute(sku, quantity);
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.post<{
    Body: { sku: string; reservationId: string; quantity: number; expiresAt: string };
  }>("/warehouse/reservations", async (request, reply) => {
    try {
      const { sku, reservationId, quantity, expiresAt } = request.body;
      const confirmation = createReservation.execute(sku, reservationId, quantity, expiresAt);
      reply.code(201).send(confirmation);
    } catch (error) {
      reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.delete<{ Params: { sku: string; reservationId: string } }>(
    "/warehouse/reservations/:sku/:reservationId",
    async (request, reply) => {
      try {
        const { sku, reservationId } = request.params;
        releaseReservation.execute(sku, reservationId);
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.get<{ Params: { sku: string } }>("/warehouse/inventory/:sku", async (request, reply) => {
    try {
      const { sku } = request.params;
      const inventory = getInventory.execute(sku);
      reply.code(200).send(inventory);
    } catch (error) {
      reply.code(404).send({ error: (error as Error).message });
    }
  });

  fastify.get<{ Params: { sku: string } }>(
    "/warehouse/availability/:sku",
    async (request, reply) => {
      const { sku } = request.params;
      const availability = checkAvailability.execute(sku);
      reply.code(200).send(availability);
    },
  );
}
