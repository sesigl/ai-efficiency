import type { FastifyInstance } from "fastify";
import type { PricingUseCases } from "../modules/pricing/infrastructure/di.js";
import type { WarehouseUseCases } from "../modules/warehouse/infrastructure/di.js";
import type { PromotionType } from "../modules/pricing/domain/price-entry/Promotion.js";

export function registerItemRoutes(
  fastify: FastifyInstance,
  warehouseUseCases: WarehouseUseCases,
  pricingUseCases: PricingUseCases,
): void {
  // Pricing: Set base price
  fastify.put<{
    Params: { sku: string };
    Body: { priceInCents: number; currency?: string };
  }>("/items/:sku/price", async (request, reply) => {
    try {
      pricingUseCases.priceEntries.setBasePrice({
        sku: request.params.sku,
        priceInCents: request.body.priceInCents,
        currency: request.body.currency ?? "USD",
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Pricing: Get price entry
  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/price", async (request, reply) => {
    const entry = pricingUseCases.priceEntries.getPriceEntry({ sku: request.params.sku });
    if (!entry) {
      return reply.code(404).send({ error: "Price entry not found" });
    }
    return reply.send(entry);
  });

  // Pricing: Add promotion
  fastify.post<{
    Params: { sku: string };
    Body: {
      name: string;
      type: PromotionType;
      discountPercentage: number;
      validFrom: string;
      validUntil: string;
      priority?: number;
    };
  }>("/items/:sku/promotions", async (request, reply) => {
    try {
      pricingUseCases.promotions.addPromotion({
        sku: request.params.sku,
        name: request.body.name,
        type: request.body.type,
        discountPercentage: request.body.discountPercentage,
        validFrom: new Date(request.body.validFrom),
        validUntil: new Date(request.body.validUntil),
        priority: request.body.priority ?? 0,
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Pricing: Remove promotion
  fastify.delete<{
    Params: { sku: string; promotionName: string };
  }>("/items/:sku/promotions/:promotionName", async (request, reply) => {
    try {
      pricingUseCases.promotions.removePromotion({
        sku: request.params.sku,
        promotionName: request.params.promotionName,
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Pricing: Calculate price quote
  fastify.get<{
    Params: { sku: string };
    Querystring: { at?: string };
  }>("/items/:sku/price-quote", async (request, reply) => {
    try {
      const at = request.query.at ? new Date(request.query.at) : new Date();
      const calculatedPrice = pricingUseCases.priceEntries.calculatePrice({
        sku: request.params.sku,
        at,
      });
      return reply.send({
        sku: calculatedPrice.sku,
        basePriceInCents: calculatedPrice.basePrice.getCents(),
        finalPriceInCents: calculatedPrice.finalPrice.getCents(),
        currency: calculatedPrice.basePrice.getCurrency(),
        totalDiscountPercentage: calculatedPrice.getTotalDiscountPercentage(),
        appliedDiscounts: calculatedPrice.appliedDiscounts.map((d) => ({
          promotionName: d.promotionName,
          originalPercentage: d.originalPercentage,
          appliedPercentage: d.appliedPercentage,
          reason: d.reason,
        })),
      });
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Warehouse: Stock adjustments (add/remove via quantityDelta)
  fastify.post<{
    Params: { sku: string };
    Body: { quantityDelta: number };
  }>("/items/:sku/stock-adjustments", async (request, reply) => {
    try {
      const { quantityDelta } = request.body;
      const sku = request.params.sku;

      if (quantityDelta < 0) {
        warehouseUseCases.inventory.removeStock({
          sku,
          quantity: Math.abs(quantityDelta),
        });
      } else {
        warehouseUseCases.inventory.addStock({
          sku,
          quantity: quantityDelta,
        });
      }

      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Warehouse: Get stock (inventory item)
  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/stock", async (request, reply) => {
    const item = warehouseUseCases.inventory.getInventoryItem({ sku: request.params.sku });
    if (!item) {
      return reply.code(404).send({ error: "Inventory item not found" });
    }
    return reply.send(item);
  });

  // Warehouse: Create reservation
  fastify.post<{
    Params: { sku: string };
    Body: { reservationId: string; quantity: number; expiresAt: string };
  }>("/items/:sku/reservations", async (request, reply) => {
    try {
      const result = warehouseUseCases.reservations.reserveStock({
        sku: request.params.sku,
        reservationId: request.body.reservationId,
        quantity: request.body.quantity,
        expiresAt: new Date(request.body.expiresAt),
      });
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Warehouse: Release reservation
  fastify.delete<{
    Params: { sku: string; reservationId: string };
  }>("/items/:sku/reservations/:reservationId", async (request, reply) => {
    try {
      warehouseUseCases.reservations.releaseReservation({
        sku: request.params.sku,
        reservationId: request.params.reservationId,
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  // Warehouse: Get availability
  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/availability", async (request, reply) => {
    const availability = warehouseUseCases.inventory.getAvailability({ sku: request.params.sku });
    return reply.send(availability);
  });
}
