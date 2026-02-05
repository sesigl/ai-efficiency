import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp, futureDate, promotionDates } from "./test-utils.js";

describe("Cross-Context Integration API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("Health Check", () => {
    it("returns healthy status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok" });
    });
  });

  describe("Pricing reacts to Warehouse availability", () => {
    it("applies full Black Friday discount when warehouse has high stock", async () => {
      await app.inject({
        method: "POST",
        url: "/warehouse/stock/add",
        payload: { sku: "TV-001", quantity: 100 },
      });

      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
          priority: 10,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });

      expect(response.json().basePriceInCents).toBe(50000);
      expect(response.json().finalPriceInCents).toBe(30000);
      expect(response.json().appliedDiscounts[0].reason).toBe("Full discount applied");
    });

    it("reduces Black Friday discount when warehouse stock is low", async () => {
      await app.inject({
        method: "POST",
        url: "/warehouse/stock/add",
        payload: { sku: "TV-001", quantity: 3 },
      });

      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
          priority: 10,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });

      expect(response.json().finalPriceInCents).toBe(40000);
      expect(response.json().appliedDiscounts[0].originalPercentage).toBe(40);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].reason).toBe("Reduced discount: low stock");
    });

    it("skips discount when product is out of stock", async () => {
      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
          priority: 10,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });

      expect(response.json().finalPriceInCents).toBe(50000);
      expect(response.json().appliedDiscounts[0].reason).toBe("No discount: item out of stock");
    });

    it("adjusts discount dynamically as stock changes", async () => {
      await app.inject({
        method: "POST",
        url: "/warehouse/stock/add",
        payload: { sku: "TV-001", quantity: 50 },
      });

      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
          priority: 10,
        },
      });

      const priceWithHighStock = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceWithHighStock.json().finalPriceInCents).toBe(30000);

      await app.inject({
        method: "POST",
        url: "/warehouse/stock/remove",
        payload: { sku: "TV-001", quantity: 48 },
      });

      const priceWithLowStock = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceWithLowStock.json().finalPriceInCents).toBe(40000);
    });

    it("reservations affect pricing discount calculations", async () => {
      await app.inject({
        method: "POST",
        url: "/warehouse/stock/add",
        payload: { sku: "TV-001", quantity: 50 },
      });

      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
        },
      });

      const priceBeforeReservation = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceBeforeReservation.json().finalPriceInCents).toBe(30000);

      await app.inject({
        method: "POST",
        url: "/warehouse/reservations",
        payload: {
          sku: "TV-001",
          reservationId: "RES-001",
          quantity: 48,
          expiresAt: futureDate(),
        },
      });

      const priceAfterReservation = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceAfterReservation.json().finalPriceInCents).toBe(40000);
    });

    it("releasing reservation restores full discount", async () => {
      await app.inject({
        method: "POST",
        url: "/warehouse/stock/add",
        payload: { sku: "TV-001", quantity: 20 },
      });

      await app.inject({
        method: "POST",
        url: "/pricing/base-price",
        payload: { sku: "TV-001", priceInCents: 10000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: "/pricing/promotions",
        payload: {
          sku: "TV-001",
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
        },
      });

      await app.inject({
        method: "POST",
        url: "/warehouse/reservations",
        payload: {
          sku: "TV-001",
          reservationId: "RES-001",
          quantity: 18,
          expiresAt: futureDate(),
        },
      });

      const priceWithReservation = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceWithReservation.json().appliedDiscounts[0].appliedPercentage).toBe(20);

      await app.inject({
        method: "DELETE",
        url: "/warehouse/reservations/TV-001/RES-001",
      });

      const priceAfterRelease = await app.inject({
        method: "GET",
        url: "/pricing/calculate/TV-001",
      });
      expect(priceAfterRelease.json().appliedDiscounts[0].appliedPercentage).toBe(40);
    });
  });
});
