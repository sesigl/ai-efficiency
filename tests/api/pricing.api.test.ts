import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp, promotionDates, pastPromotionDates } from "./test-utils.js";

describe("Price API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /prices/base", () => {
    it("creates price entry for new SKU", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      expect(response.statusCode).toBe(204);

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().basePriceInCents).toBe(999);
    });

    it("updates base price for existing SKU", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1299 },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().basePriceInCents).toBe(1299);
    });

    it("rejects zero base price", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 0 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Base price cannot be zero");
    });

    it("uses USD as default currency", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().currency).toBe("USD");
    });

    it("accepts custom currency", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999, currency: "EUR" },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().currency).toBe("EUR");
    });
  });

  describe("POST /prices/promotions", () => {
    it("adds promotion to existing price entry", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      const response = await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
          priority: 10,
        },
      });

      expect(response.statusCode).toBe(204);

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().promotions).toHaveLength(1);
      expect(entryResponse.json().promotions[0].name).toBe("Black Friday");
    });

    it("rejects promotion for non-existent SKU", async () => {
      const { validFrom, validUntil } = promotionDates();
      const response = await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "UNKNOWN",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain("Price entry not found");
    });

    it("rejects duplicate promotion", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain("Promotion already exists");
    });
  });

  describe("DELETE /prices/promotions/:sku/:promotionName", () => {
    it("removes promotion from price entry", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: "/prices/promotions/APPLE-001/Black Friday",
      });

      expect(response.statusCode).toBe(204);

      const entryResponse = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });
      expect(entryResponse.json().promotions).toHaveLength(0);
    });
  });

  describe("GET /prices/entries/:sku", () => {
    it("returns price entry with promotions", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/entries/APPLE-001",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        sku: "APPLE-001",
        basePriceInCents: 1000,
        currency: "USD",
      });
      expect(response.json().promotions).toHaveLength(1);
    });

    it("returns 404 for non-existent SKU", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/prices/entries/UNKNOWN",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe("Price entry not found");
    });
  });

  describe("GET /prices/calculate/:sku", () => {
    it("returns base price when no promotions exist", async () => {
      await app.inject({
        method: "POST",
        url: "/stock/add",
        payload: { sku: "APPLE-001", quantity: 100 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/calculate/APPLE-001",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().basePriceInCents).toBe(1000);
      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts).toHaveLength(0);
    });

    it("applies full discount when stock is high", async () => {
      await app.inject({
        method: "POST",
        url: "/stock/add",
        payload: { sku: "APPLE-001", quantity: 100 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/calculate/APPLE-001",
      });

      expect(response.json().finalPriceInCents).toBe(800);
      expect(response.json().totalDiscountPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].reason).toBe("Full discount applied");
    });

    it("reduces discount by 50% when stock is low", async () => {
      await app.inject({
        method: "POST",
        url: "/stock/add",
        payload: { sku: "APPLE-001", quantity: 3 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/calculate/APPLE-001",
      });

      expect(response.json().finalPriceInCents).toBe(900);
      expect(response.json().appliedDiscounts[0].originalPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(10);
      expect(response.json().appliedDiscounts[0].reason).toBe("Reduced discount: low stock");
    });

    it("applies no discount when out of stock", async () => {
      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/calculate/APPLE-001",
      });

      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(0);
      expect(response.json().appliedDiscounts[0].reason).toBe("No discount: item out of stock");
    });

    it("ignores inactive promotions", async () => {
      await app.inject({
        method: "POST",
        url: "/stock/add",
        payload: { sku: "APPLE-001", quantity: 100 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = pastPromotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Old Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/prices/calculate/APPLE-001",
      });

      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts).toHaveLength(0);
    });

    it("supports date parameter for historical calculation", async () => {
      await app.inject({
        method: "POST",
        url: "/stock/add",
        payload: { sku: "APPLE-001", quantity: 100 },
      });

      await app.inject({
        method: "POST",
        url: "/prices/base",
        payload: { sku: "APPLE-001", priceInCents: 1000 },
      });

      const { validFrom, validUntil } = pastPromotionDates();
      await app.inject({
        method: "POST",
        url: "/prices/promotions",
        payload: {
          sku: "APPLE-001",
          name: "Old Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
        },
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);

      const response = await app.inject({
        method: "GET",
        url: `/prices/calculate/APPLE-001?at=${pastDate.toISOString()}`,
      });

      expect(response.json().finalPriceInCents).toBe(850);
      expect(response.json().appliedDiscounts).toHaveLength(1);
    });
  });
});
