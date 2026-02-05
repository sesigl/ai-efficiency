import type { FastifyInstance } from "fastify";
import { SetPriceUseCase } from "./set-price-use-case.js";
import { AddPromotionUseCase } from "./add-promotion-use-case.js";
import { RemovePromotionUseCase } from "./remove-promotion-use-case.js";
import { GetPriceUseCase } from "./get-price-use-case.js";
import { CalculatePriceQuoteUseCase } from "./calculate-price-quote-use-case.js";
import type { PricingRepository } from "./pricing-repository.js";
import type { InventoryRepository } from "../inventory/inventory-repository.js";

export function registerPricingRoutes(
  fastify: FastifyInstance,
  pricingRepository: PricingRepository,
  inventoryRepository: InventoryRepository,
) {
  const setPriceUseCase = new SetPriceUseCase(pricingRepository);
  const addPromotionUseCase = new AddPromotionUseCase(pricingRepository);
  const removePromotionUseCase = new RemovePromotionUseCase(pricingRepository);
  const getPriceUseCase = new GetPriceUseCase(pricingRepository);
  const calculatePriceQuoteUseCase = new CalculatePriceQuoteUseCase(
    pricingRepository,
    inventoryRepository,
  );

  fastify.put<{
    Params: { sku: string };
    Body: { priceInCents: number; currency?: string };
  }>("/items/:sku/price", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { priceInCents, currency } = request.body;

      const requestData: { sku: string; priceInCents: number; currency?: string } = {
        sku,
        priceInCents,
      };

      if (currency !== undefined) {
        requestData.currency = currency;
      }

      setPriceUseCase.execute(requestData);

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
    Body: {
      name: string;
      type: string;
      discountPercentage: number;
      validFrom: string;
      validUntil: string;
      priority?: number;
    };
  }>("/items/:sku/promotions", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { name, type, discountPercentage, validFrom, validUntil, priority } = request.body;

      const requestData: {
        sku: string;
        name: string;
        type: string;
        discountPercentage: number;
        validFrom: string;
        validUntil: string;
        priority?: number;
      } = {
        sku,
        name,
        type,
        discountPercentage,
        validFrom,
        validUntil,
      };

      if (priority !== undefined) {
        requestData.priority = priority;
      }

      addPromotionUseCase.execute(requestData);

      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.delete<{
    Params: { sku: string; promotionName: string };
  }>("/items/:sku/promotions/:promotionName", async (request, reply) => {
    const { sku, promotionName } = request.params;

    removePromotionUseCase.execute(sku, decodeURIComponent(promotionName));

    return reply.code(204).send();
  });

  fastify.get<{
    Params: { sku: string };
  }>("/items/:sku/price", async (request, reply) => {
    try {
      const { sku } = request.params;

      const result = getPriceUseCase.execute(sku);

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
    Querystring: { at?: string };
  }>("/items/:sku/price-quote", async (request, reply) => {
    try {
      const { sku } = request.params;
      const { at } = request.query;

      const atDate = at ? new Date(at) : undefined;

      const result = calculatePriceQuoteUseCase.execute(sku, atDate);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });
}
