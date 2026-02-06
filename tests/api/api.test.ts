import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  createTestApp,
  futureDate,
  itemPromotionUrl,
  itemUrl,
  pastPromotionDates,
  promotionDates,
} from "./test-utils.js";

describe("API", () => {
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

  describe("PUT /items/:sku/price", () => {
    it("creates price entry for new SKU", async () => {
      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      expect(response.statusCode).toBe(204);

      const entryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().basePriceInCents).toBe(999);
    });

    it("updates base price for existing SKU", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1299 },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().basePriceInCents).toBe(1299);
    });

    it("rejects zero base price", async () => {
      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 0 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Base price cannot be zero");
    });

    it("uses USD as default currency", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().currency).toBe("USD");
    });

    it("accepts custom currency", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999, currency: "EUR" },
      });

      const entryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().currency).toBe("EUR");
    });
  });

  describe("POST /items/:sku/promotions", () => {
    it("adds promotion to existing price entry", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
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
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().promotions).toHaveLength(1);
      expect(entryResponse.json().promotions[0].name).toBe("Black Friday");
    });

    it("rejects promotion for non-existent SKU", async () => {
      const { validFrom, validUntil } = promotionDates();
      const response = await app.inject({
        method: "POST",
        url: itemUrl("UNKNOWN", "promotions"),
        payload: {
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
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
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

  describe("DELETE /items/:sku/promotions/:promotionName", () => {
    it("removes promotion from price entry", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 999 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 30,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: itemPromotionUrl("APPLE-001", "Black Friday"),
      });

      expect(response.statusCode).toBe(204);

      const entryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
      });
      expect(entryResponse.json().promotions).toHaveLength(0);
    });
  });

  describe("GET /items/:sku/price", () => {
    it("returns price entry with promotions", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price"),
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
        url: itemUrl("UNKNOWN", "price"),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe("Price entry not found");
    });
  });

  describe("GET /items/:sku/price-quote", () => {
    it("returns base price when no promotions exist", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().basePriceInCents).toBe(1000);
      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts).toHaveLength(0);
    });

    it("applies full discount when stock is high", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(800);
      expect(response.json().totalDiscountPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].reason).toBe("Full discount applied");
    });

    it("reduces discount by 50% when stock is low", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 3 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(900);
      expect(response.json().appliedDiscounts[0].originalPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(10);
      expect(response.json().appliedDiscounts[0].reason).toBe("Reduced discount: low stock");
    });

    it("applies no discount when out of stock", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(0);
      expect(response.json().appliedDiscounts[0].reason).toBe("No discount: item out of stock");
    });

    it("ignores inactive promotions", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = pastPromotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Old Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(1000);
      expect(response.json().appliedDiscounts).toHaveLength(0);
    });

    it("supports date parameter for historical calculation", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = pastPromotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
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
        url: `${itemUrl("APPLE-001", "price-quote")}?at=${pastDate.toISOString()}`,
      });

      expect(response.json().finalPriceInCents).toBe(850);
      expect(response.json().appliedDiscounts).toHaveLength(1);
    });

    it("applies full Black Friday discount when stock is high", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
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
        url: itemUrl("TV-001", "price-quote"),
      });

      expect(response.json().basePriceInCents).toBe(50000);
      expect(response.json().finalPriceInCents).toBe(30000);
      expect(response.json().appliedDiscounts[0].reason).toBe("Full discount applied");
    });

    it("reduces Black Friday discount when stock is low", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: 3 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
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
        url: itemUrl("TV-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(40000);
      expect(response.json().appliedDiscounts[0].originalPercentage).toBe(40);
      expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(20);
      expect(response.json().appliedDiscounts[0].reason).toBe("Reduced discount: low stock");
    });

    it("skips discount when product is out of stock", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
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
        url: itemUrl("TV-001", "price-quote"),
      });

      expect(response.json().finalPriceInCents).toBe(50000);
      expect(response.json().appliedDiscounts[0].reason).toBe("No discount: item out of stock");
    });

    it("adjusts discount dynamically as stock changes", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
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
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceWithHighStock.json().finalPriceInCents).toBe(30000);

      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: -48 },
      });

      const priceWithLowStock = await app.inject({
        method: "GET",
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceWithLowStock.json().finalPriceInCents).toBe(40000);
    });

    it("updates discount based on reserved stock", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 50000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
        },
      });

      const priceBeforeReservation = await app.inject({
        method: "GET",
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceBeforeReservation.json().finalPriceInCents).toBe(30000);

      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 48,
          expiresAt: futureDate(),
        },
      });

      const priceAfterReservation = await app.inject({
        method: "GET",
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceAfterReservation.json().finalPriceInCents).toBe(40000);
    });

    it("restores full discount after releasing reservation", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "stock-adjustments"),
        payload: { quantityDelta: 20 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("TV-001", "price"),
        payload: { priceInCents: 10000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "promotions"),
        payload: {
          name: "Black Friday",
          type: "BLACK_FRIDAY",
          discountPercentage: 40,
          validFrom,
          validUntil,
        },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("TV-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 18,
          expiresAt: futureDate(),
        },
      });

      const priceWithReservation = await app.inject({
        method: "GET",
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceWithReservation.json().appliedDiscounts[0].appliedPercentage).toBe(20);

      await app.inject({
        method: "DELETE",
        url: itemUrl("TV-001", "reservations/RES-001"),
      });

      const priceAfterRelease = await app.inject({
        method: "GET",
        url: itemUrl("TV-001", "price-quote"),
      });
      expect(priceAfterRelease.json().appliedDiscounts[0].appliedPercentage).toBe(40);
    });
  });

  describe("POST /items/:sku/stock-adjustments", () => {
    it("creates inventory item when adding stock to new SKU", async () => {
      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      expect(response.statusCode).toBe(204);

      const inventoryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(inventoryResponse.json().quantity).toBe(50);
    });

    it("increases quantity when adding stock to existing SKU", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 30 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 20 },
      });

      const inventoryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(inventoryResponse.json().quantity).toBe(50);
    });

    it("rejects adding zero quantity", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 0 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Cannot add zero quantity");
    });
  });

  describe("POST /items/:sku/stock-adjustments (negative delta)", () => {
    it("decreases quantity when removing stock", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: -20 },
      });

      expect(response.statusCode).toBe(204);

      const inventoryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(inventoryResponse.json().quantity).toBe(30);
    });

    it("rejects removing from non-existent SKU", async () => {
      const response = await app.inject({
        method: "POST",
        url: itemUrl("UNKNOWN", "stock-adjustments"),
        payload: { quantityDelta: -10 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain("Inventory item not found");
    });

    it("rejects removing more than available", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: -10 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Insufficient available stock");
    });

    it("prevents removing stock that is reserved", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 8,
          expiresAt: futureDate(),
        },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: -5 },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Insufficient available stock");
    });
  });

  describe("POST /items/:sku/reservations", () => {
    it("creates reservation and returns confirmation", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 10,
          expiresAt: futureDate(),
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().reservationId).toBe("RES-001");
      expect(response.json().quantity).toBe(10);
    });

    it("reduces available quantity when creating reservation", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 10,
          expiresAt: futureDate(),
        },
      });

      const inventoryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(inventoryResponse.json().quantity).toBe(50);
      expect(inventoryResponse.json().availableQuantity).toBe(40);
    });

    it("rejects reservation exceeding available quantity", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 10,
          expiresAt: futureDate(),
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("Insufficient available stock for reservation");
    });
  });

  describe("DELETE /items/:sku/reservations/:reservationId", () => {
    it("restores available quantity after releasing reservation", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 10,
          expiresAt: futureDate(),
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: itemUrl("APPLE-001", "reservations/RES-001"),
      });

      expect(response.statusCode).toBe(204);

      const inventoryResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(inventoryResponse.json().availableQuantity).toBe(50);
    });
  });

  describe("GET /items/:sku/stock", () => {
    it("returns inventory item details", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 20,
          expiresAt: futureDate(),
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        sku: "APPLE-001",
        quantity: 100,
        availableQuantity: 80,
      });
      expect(response.json().reservations).toHaveLength(1);
    });

    it("returns 404 for non-existent SKU", async () => {
      const response = await app.inject({
        method: "GET",
        url: itemUrl("UNKNOWN", "stock"),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe("Inventory item not found");
    });
  });

  describe("GET /items/:sku/availability", () => {
    it("returns HIGH availability for well-stocked item", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "availability"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().level).toBe("HIGH");
      expect(response.json().isLow).toBe(false);
      expect(response.json().isOutOfStock).toBe(false);
    });

    it("returns LOW availability for low stock", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 3 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "availability"),
      });

      expect(response.json().level).toBe("LOW");
      expect(response.json().isLow).toBe(true);
    });

    it("returns OUT_OF_STOCK for unknown SKU", async () => {
      const response = await app.inject({
        method: "GET",
        url: itemUrl("UNKNOWN", "availability"),
      });

      expect(response.json().level).toBe("OUT_OF_STOCK");
      expect(response.json().isOutOfStock).toBe(true);
    });

    it("considers reservations when calculating availability level", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 20 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 18,
          expiresAt: futureDate(),
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "availability"),
      });

      expect(response.json().level).toBe("LOW");
      expect(response.json().isLow).toBe(true);
    });

    it("returns OUT_OF_STOCK when all stock is reserved", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "reservations"),
        payload: {
          reservationId: "RES-001",
          quantity: 10,
          expiresAt: futureDate(),
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "availability"),
      });

      expect(response.json().level).toBe("OUT_OF_STOCK");
      expect(response.json().isOutOfStock).toBe(true);
    });

    it("does not expose inventory internals in availability signal", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "availability"),
      });

      const availability = response.json();
      expect(availability).toHaveProperty("sku");
      expect(availability).toHaveProperty("level");
      expect(availability).toHaveProperty("isLow");
      expect(availability).toHaveProperty("isOutOfStock");
      expect(availability).not.toHaveProperty("quantity");
      expect(availability).not.toHaveProperty("reservations");
    });
  });

  describe("PUT /items/:sku/physical-count", () => {
    it("sets stock to actual count and returns delta for existing product", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "physical-count"),
        payload: { quantity: 42 },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        sku: "APPLE-001",
        previousQuantity: 50,
        newQuantity: 42,
        delta: -8,
      });
    });

    it("creates product when adjusting physical count for non-existent SKU", async () => {
      const response = await app.inject({
        method: "PUT",
        url: itemUrl("NEW-001", "physical-count"),
        payload: { quantity: 25 },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        sku: "NEW-001",
        previousQuantity: 0,
        newQuantity: 25,
        delta: 25,
      });

      const stockResponse = await app.inject({
        method: "GET",
        url: itemUrl("NEW-001", "stock"),
      });
      expect(stockResponse.json().quantity).toBe(25);
    });

    it("returns positive delta when actual count exceeds current stock", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });

      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "physical-count"),
        payload: { quantity: 15 },
      });

      expect(response.json().delta).toBe(5);
    });
  });

  describe("PUT /items/:sku/reorder-threshold", () => {
    it("sets reorder threshold for a product", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      expect(response.statusCode).toBe(204);
    });

    it("flags product as needs reorder when available quantity equals threshold", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/items/reorder-needed",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sku: "APPLE-001",
          }),
        ]),
      );
    });

    it("flags product as needs reorder when available quantity drops below threshold", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/items/reorder-needed",
      });

      expect(response.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sku: "APPLE-001",
          }),
        ]),
      );
    });

    it("creates product when setting threshold for non-existent SKU", async () => {
      const response = await app.inject({
        method: "PUT",
        url: itemUrl("NEW-001", "reorder-threshold"),
        payload: { threshold: 5 },
      });

      expect(response.statusCode).toBe(204);
    });
  });

  describe("GET /items/reorder-needed", () => {
    it("returns empty list when no items need reorder", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/items/reorder-needed",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it("returns items where available quantity is at or below threshold", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/items/reorder-needed",
      });

      expect(response.json()).toHaveLength(1);
      expect(response.json()[0].sku).toBe("APPLE-001");
    });

    it("excludes items without a reorder threshold configured", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 2 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/items/reorder-needed",
      });

      expect(response.json()).toEqual([]);
    });
  });

  describe("POST /items/:sku/shrinkage", () => {
    it("records shrinkage and removes stock with reason", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "shrinkage"),
        payload: { quantity: 5, reason: "damaged" },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({
        sku: "APPLE-001",
        quantity: 5,
        reason: "damaged",
      });

      const stockResponse = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "stock"),
      });
      expect(stockResponse.json().quantity).toBe(45);
    });

    it("accepts expired as shrinkage reason", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 20 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "shrinkage"),
        payload: { quantity: 3, reason: "expired" },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().reason).toBe("expired");
    });

    it("accepts theft as shrinkage reason", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 20 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "shrinkage"),
        payload: { quantity: 2, reason: "theft" },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().reason).toBe("theft");
    });

    it("rejects shrinkage when insufficient stock", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "shrinkage"),
        payload: { quantity: 10, reason: "damaged" },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain("Insufficient");
    });

    it("rejects shrinkage for non-existent product", async () => {
      const response = await app.inject({
        method: "POST",
        url: itemUrl("UNKNOWN", "shrinkage"),
        payload: { quantity: 5, reason: "damaged" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /inventory/summary", () => {
    it("returns aggregated inventory overview", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "stock-adjustments"),
        payload: { quantityDelta: 30 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/inventory/summary",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        totalProducts: 2,
        totalUnitsInStock: 80,
        itemsNeedingReorder: 0,
        outOfStockItems: 0,
      });
    });

    it("counts out-of-stock items", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 50 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "stock-adjustments"),
        payload: { quantityDelta: 10 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "stock-adjustments"),
        payload: { quantityDelta: -10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/inventory/summary",
      });

      expect(response.json().outOfStockItems).toBe(1);
    });

    it("counts items needing reorder", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 5 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "reorder-threshold"),
        payload: { threshold: 10 },
      });

      const response = await app.inject({
        method: "GET",
        url: "/inventory/summary",
      });

      expect(response.json().itemsNeedingReorder).toBe(1);
    });

    it("returns zeros when no products exist", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/inventory/summary",
      });

      expect(response.json()).toMatchObject({
        totalProducts: 0,
        totalUnitsInStock: 0,
        itemsNeedingReorder: 0,
        outOfStockItems: 0,
      });
    });
  });

  describe("POST /items/:sku/scheduled-price-changes", () => {
    it("schedules a future base price change", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const response = await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "scheduled-price-changes"),
        payload: { priceInCents: 1200, effectiveDate: futureDate(30) },
      });

      expect(response.statusCode).toBe(201);
    });

    it("keeps current price before effective date", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "scheduled-price-changes"),
        payload: { priceInCents: 1200, effectiveDate: futureDate(30) },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().basePriceInCents).toBe(1000);
    });

    it("applies scheduled price after effective date", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "scheduled-price-changes"),
        payload: { priceInCents: 1200, effectiveDate: pastDate.toISOString() },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "price-quote"),
      });

      expect(response.json().basePriceInCents).toBe(1200);
    });

    it("rejects scheduling for non-existent price entry", async () => {
      const response = await app.inject({
        method: "POST",
        url: itemUrl("UNKNOWN", "scheduled-price-changes"),
        payload: { priceInCents: 1200, effectiveDate: futureDate(30) },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /promotions/active", () => {
    it("returns all currently active promotions across products", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "price"),
        payload: { priceInCents: 500 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 10,
          validFrom,
          validUntil,
        },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("BANANA-001", "promotions"),
        payload: {
          name: "Clearance",
          type: "CLEARANCE",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/promotions/active",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveLength(2);
    });

    it("filters active promotions by type", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 10,
          validFrom,
          validUntil,
        },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Clearance",
          type: "CLEARANCE",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/promotions/active?type=SEASONAL",
      });

      expect(response.json()).toHaveLength(1);
      expect(response.json()[0].name).toBe("Summer Sale");
    });

    it("excludes expired promotions", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const { validFrom, validUntil } = pastPromotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Old Sale",
          type: "SEASONAL",
          discountPercentage: 10,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/promotions/active",
      });

      expect(response.json()).toHaveLength(0);
    });
  });

  describe("PUT /items/:sku/bulk-discount-tiers", () => {
    it("creates tiered bulk discount for a product", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });

      const response = await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "bulk-discount-tiers"),
        payload: {
          tiers: [
            { minQuantity: 1, maxQuantity: 9, discountPercentage: 0 },
            { minQuantity: 10, maxQuantity: 49, discountPercentage: 5 },
            { minQuantity: 50, discountPercentage: 15 },
          ],
        },
      });

      expect(response.statusCode).toBe(204);
    });

    it("applies correct tier when calculating price quote with quantity", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });

      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "bulk-discount-tiers"),
        payload: {
          tiers: [
            { minQuantity: 1, maxQuantity: 9, discountPercentage: 0 },
            { minQuantity: 10, maxQuantity: 49, discountPercentage: 5 },
            { minQuantity: 50, discountPercentage: 15 },
          ],
        },
      });

      const responseSingle = await app.inject({
        method: "GET",
        url: `${itemUrl("APPLE-001", "price-quote")}?quantity=1`,
      });
      expect(responseSingle.json().finalPriceInCents).toBe(1000);

      const responseMid = await app.inject({
        method: "GET",
        url: `${itemUrl("APPLE-001", "price-quote")}?quantity=25`,
      });
      expect(responseMid.json().finalPriceInCents).toBe(950);

      const responseBulk = await app.inject({
        method: "GET",
        url: `${itemUrl("APPLE-001", "price-quote")}?quantity=100`,
      });
      expect(responseBulk.json().finalPriceInCents).toBe(850);
    });

    it("rejects tiers for non-existent price entry", async () => {
      const response = await app.inject({
        method: "PUT",
        url: itemUrl("UNKNOWN", "bulk-discount-tiers"),
        payload: {
          tiers: [{ minQuantity: 1, discountPercentage: 0 }],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /promotions/:promotionName/clone", () => {
    it("clones promotion to multiple target products", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "price"),
        payload: { priceInCents: 500 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("CHERRY-001", "price"),
        payload: { priceInCents: 800 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
          priority: 5,
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/promotions/Summer%20Sale/clone",
        payload: {
          sourceSku: "APPLE-001",
          targetSkus: ["BANANA-001", "CHERRY-001"],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().cloned).toBe(2);
      expect(response.json().skipped).toEqual([]);
    });

    it("skips target products without price entries", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "price"),
        payload: { priceInCents: 500 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/promotions/Summer%20Sale/clone",
        payload: {
          sourceSku: "APPLE-001",
          targetSkus: ["BANANA-001", "UNKNOWN-001"],
        },
      });

      expect(response.json().cloned).toBe(1);
      expect(response.json().skipped).toEqual(["UNKNOWN-001"]);
    });

    it("verifies cloned promotions are applied to target products", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 1000 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("BANANA-001", "price"),
        payload: { priceInCents: 500 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 15,
          validFrom,
          validUntil,
        },
      });

      await app.inject({
        method: "POST",
        url: "/promotions/Summer%20Sale/clone",
        payload: {
          sourceSku: "APPLE-001",
          targetSkus: ["BANANA-001"],
        },
      });

      const priceResponse = await app.inject({
        method: "GET",
        url: itemUrl("BANANA-001", "price"),
      });

      expect(priceResponse.json().promotions).toHaveLength(1);
      expect(priceResponse.json().promotions[0].name).toBe("Summer Sale");
      expect(priceResponse.json().promotions[0].discountPercentage).toBe(15);
    });
  });

  describe("GET /items/:sku/savings-summary", () => {
    it("returns detailed savings breakdown with active promotions", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 10000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 10,
          validFrom,
          validUntil,
        },
      });
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Member Discount",
          type: "MEMBER",
          discountPercentage: 5,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "savings-summary"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().basePriceInCents).toBe(10000);
      expect(response.json().finalPriceInCents).toBe(8500);
      expect(response.json().totalSavingsInCents).toBe(1500);
      expect(response.json().totalSavingsPercentage).toBe(15);
      expect(response.json().discounts).toHaveLength(2);
      expect(response.json().discounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Summer Sale",
            amountSavedInCents: 1000,
          }),
          expect.objectContaining({
            name: "Member Discount",
            amountSavedInCents: 500,
          }),
        ]),
      );
    });

    it("returns zero savings when no promotions are active", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 5000 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "savings-summary"),
      });

      expect(response.json().totalSavingsInCents).toBe(0);
      expect(response.json().totalSavingsPercentage).toBe(0);
      expect(response.json().discounts).toHaveLength(0);
    });

    it("returns 404 for non-existent price entry", async () => {
      const response = await app.inject({
        method: "GET",
        url: itemUrl("UNKNOWN", "savings-summary"),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /items/:sku/shelf-label", () => {
    it("returns shelf label with discount info when promotion is active", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 10000 },
      });

      const { validFrom, validUntil } = promotionDates();
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "promotions"),
        payload: {
          name: "Summer Sale",
          type: "SEASONAL",
          discountPercentage: 20,
          validFrom,
          validUntil,
        },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "shelf-label"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        sku: "APPLE-001",
        finalPriceInCents: 8000,
        originalBasePriceInCents: 10000,
        savingsPercentage: 20,
        availabilityBadge: "In Stock",
      });
    });

    it("omits original base price when no discount is active", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 100 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 5000 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "shelf-label"),
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().finalPriceInCents).toBe(5000);
      expect(response.json().savingsPercentage).toBe(0);
      expect(response.json()).not.toHaveProperty("originalBasePriceInCents");
    });

    it("shows Low Stock badge when available quantity is low", async () => {
      await app.inject({
        method: "POST",
        url: itemUrl("APPLE-001", "stock-adjustments"),
        payload: { quantityDelta: 3 },
      });
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 5000 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "shelf-label"),
      });

      expect(response.json().availabilityBadge).toBe("Low Stock");
    });

    it("shows Out of Stock badge when no stock available", async () => {
      await app.inject({
        method: "PUT",
        url: itemUrl("APPLE-001", "price"),
        payload: { priceInCents: 5000 },
      });

      const response = await app.inject({
        method: "GET",
        url: itemUrl("APPLE-001", "shelf-label"),
      });

      expect(response.json().availabilityBadge).toBe("Out of Stock");
    });

    it("returns 404 when product has no price entry", async () => {
      const response = await app.inject({
        method: "GET",
        url: itemUrl("UNKNOWN", "shelf-label"),
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
