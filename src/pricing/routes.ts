import type { FastifyInstance } from "fastify";
import { PriceRepository } from "./price-repository.js";
import { SetBasePrice } from "./set-base-price.js";
import { AddPromotion } from "./add-promotion.js";
import { RemovePromotion } from "./remove-promotion.js";
import { GetPriceEntry } from "./get-price-entry.js";
import { CalculatePrice } from "./calculate-price.js";
import type { CheckAvailability } from "../warehouse/check-availability.js";
import type { Promotion } from "./price-entry.js";

export function registerPricingRoutes(
  fastify: FastifyInstance,
  repository: PriceRepository,
  checkAvailability: CheckAvailability,
): void {
  const setBasePrice = new SetBasePrice(repository);
  const addPromotion = new AddPromotion(repository);
  const removePromotion = new RemovePromotion(repository);
  const getPriceEntry = new GetPriceEntry(repository);
  const calculatePrice = new CalculatePrice(repository, checkAvailability);

  fastify.post<{ Body: { sku: string; priceInCents: number; currency?: string } }>(
    "/pricing/base-price",
    async (request, reply) => {
      try {
        const { sku, priceInCents, currency } = request.body;
        setBasePrice.execute(sku, priceInCents, currency);
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.post<{ Body: { sku: string } & Promotion }>(
    "/pricing/promotions",
    async (request, reply) => {
      try {
        const { sku, name, type, discountPercentage, validFrom, validUntil, priority } =
          request.body;
        const promotion: Promotion = {
          name,
          type,
          discountPercentage,
          validFrom,
          validUntil,
          priority: priority ?? 0,
        };
        addPromotion.execute(sku, promotion);
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.delete<{ Params: { sku: string; promotionName: string } }>(
    "/pricing/promotions/:sku/:promotionName",
    async (request, reply) => {
      try {
        const { sku, promotionName } = request.params;
        removePromotion.execute(sku, decodeURIComponent(promotionName));
        reply.code(204).send();
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );

  fastify.get<{ Params: { sku: string } }>("/pricing/entries/:sku", async (request, reply) => {
    try {
      const { sku } = request.params;
      const entry = getPriceEntry.execute(sku);
      reply.code(200).send(entry);
    } catch (error) {
      reply.code(404).send({ error: (error as Error).message });
    }
  });

  fastify.get<{ Params: { sku: string }; Querystring: { at?: string } }>(
    "/pricing/calculate/:sku",
    async (request, reply) => {
      try {
        const { sku } = request.params;
        const { at } = request.query;
        const calculationDate = at ? new Date(at) : undefined;
        const calculation = calculatePrice.execute(sku, calculationDate);
        reply.code(200).send(calculation);
      } catch (error) {
        reply.code(404).send({ error: (error as Error).message });
      }
    },
  );
}
