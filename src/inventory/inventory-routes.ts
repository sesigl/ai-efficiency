import type { FastifyInstance } from "fastify";
import type { ShrinkageReason } from "./inventory-item.js";
import { AdjustStockUseCase } from "./adjust-stock-use-case.js";
import { ReserveStockUseCase } from "./reserve-stock-use-case.js";
import { ReleaseReservationUseCase } from "./release-reservation-use-case.js";
import { GetStockUseCase } from "./get-stock-use-case.js";
import { GetAvailabilityUseCase } from "./get-availability-use-case.js";
import { PhysicalCountUseCase } from "./physical-count-use-case.js";
import { SetReorderThresholdUseCase } from "./set-reorder-threshold-use-case.js";
import { ListReorderNeededUseCase } from "./list-reorder-needed-use-case.js";
import { RecordShrinkageUseCase } from "./record-shrinkage-use-case.js";
import { GetInventorySummaryUseCase } from "./get-inventory-summary-use-case.js";
import type { InventoryRepository } from "./inventory-repository.js";

export function registerInventoryRoutes(
  fastify: FastifyInstance,
  inventoryRepository: InventoryRepository,
) {
  const adjustStockUseCase = new AdjustStockUseCase(inventoryRepository);
  const reserveStockUseCase = new ReserveStockUseCase(inventoryRepository);
  const releaseReservationUseCase = new ReleaseReservationUseCase(inventoryRepository);
  const getStockUseCase = new GetStockUseCase(inventoryRepository);
  const getAvailabilityUseCase = new GetAvailabilityUseCase(inventoryRepository);
  const physicalCountUseCase = new PhysicalCountUseCase(inventoryRepository);
  const setReorderThresholdUseCase = new SetReorderThresholdUseCase(inventoryRepository);
  const listReorderNeededUseCase = new ListReorderNeededUseCase(inventoryRepository);
  const recordShrinkageUseCase = new RecordShrinkageUseCase(inventoryRepository);
  const getInventorySummaryUseCase = new GetInventorySummaryUseCase(inventoryRepository);

  fastify.post<{
    Params: { sku: string };
    Body: { quantityDelta: number };
  }>("/items/:sku/stock-adjustments", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { quantityDelta } = request.body;

      adjustStockUseCase.execute(sku, quantityDelta);

      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.post<{
    Params: { sku: string };
    Body: { reservationId: string; quantity: number; expiresAt: string };
  }>("/items/:sku/reservations", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { reservationId, quantity, expiresAt } = request.body;

      const result = reserveStockUseCase.execute({
        sku,
        reservationId,
        quantity,
        expiresAt,
      });

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.delete<{
    Params: { sku: string; reservationId: string };
  }>("/items/:sku/reservations/:reservationId", async (request, reply) => {
    const { sku, reservationId } = request.params;

    releaseReservationUseCase.execute(sku, reservationId);

    return reply.code(204).send();
  });

  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/stock", async (request, reply) => {
    try {
      const { sku } = request.params;

      const result = getStockUseCase.execute(sku);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/availability", async (request, reply) => {
    const { sku } = request.params;

    const result = getAvailabilityUseCase.execute(sku);

    return reply.code(200).send(result);
  });

  fastify.put<{
    Params: { sku: string };
    Body: { quantity: number };
  }>("/items/:sku/physical-count", async (request, reply) => {
    const { sku } = request.params;
    const { quantity } = request.body;

    const result = physicalCountUseCase.execute(sku, quantity);

    return reply.code(200).send(result);
  });

  fastify.put<{
    Params: { sku: string };
    Body: { threshold: number };
  }>("/items/:sku/reorder-threshold", async (request, reply) => {
    const { sku } = request.params;
    const { threshold } = request.body;

    setReorderThresholdUseCase.execute(sku, threshold);

    return reply.code(204).send();
  });

  fastify.get("/items/reorder-needed", async (_request, reply) => {
    const result = listReorderNeededUseCase.execute();

    return reply.code(200).send(result);
  });

  fastify.post<{
    Params: { sku: string };
    Body: { quantity: number; reason: ShrinkageReason };
  }>("/items/:sku/shrinkage", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { quantity, reason } = request.body;

      const result = recordShrinkageUseCase.execute(sku, quantity, reason);

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.get("/inventory/summary", async (_request, reply) => {
    const result = getInventorySummaryUseCase.execute();

    return reply.code(200).send(result);
  });
}
