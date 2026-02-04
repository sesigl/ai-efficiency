import type { FastifyInstance } from "fastify";
import type { PricingUseCases } from "../modules/pricing/infrastructure/di.js";
import type { PromotionType } from "../modules/pricing/domain/Promotion.js";

export function registerPricingRoutes(fastify: FastifyInstance, useCases: PricingUseCases): void {
  fastify.post<{
    Body: { sku: string; priceInCents: number; currency?: string };
  }>("/pricing/base-price", async (request, reply) => {
    try {
      useCases.priceEntries.setBasePrice({
        sku: request.body.sku,
        priceInCents: request.body.priceInCents,
        currency: request.body.currency ?? "USD",
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.post<{
    Body: {
      sku: string;
      name: string;
      type: PromotionType;
      discountPercentage: number;
      validFrom: string;
      validUntil: string;
      priority?: number;
    };
  }>("/pricing/promotions", async (request, reply) => {
    try {
      useCases.promotions.addPromotion({
        sku: request.body.sku,
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

  fastify.delete<{
    Params: { sku: string; promotionName: string };
  }>("/pricing/promotions/:sku/:promotionName", async (request, reply) => {
    try {
      useCases.promotions.removePromotion({
        sku: request.params.sku,
        promotionName: request.params.promotionName,
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  fastify.get<{
    Params: { sku: string };
  }>("/pricing/entries/:sku", async (request, reply) => {
    const entry = useCases.priceEntries.getPriceEntry({ sku: request.params.sku });
    if (!entry) {
      return reply.code(404).send({ error: "Price entry not found" });
    }
    return reply.send(entry);
  });

  fastify.get<{
    Params: { sku: string };
    Querystring: { at?: string };
  }>("/pricing/calculate/:sku", async (request, reply) => {
    try {
      const at = request.query.at ? new Date(request.query.at) : new Date();
      const calculatedPrice = useCases.priceEntries.calculatePrice({
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
}
