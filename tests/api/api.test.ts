import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createApp } from "../../src/index.js";
import type { FastifyInstance } from "fastify";

describe("API Tests", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { fastify } = createApp();
    app = fastify;
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function futureDate(daysFromNow: number = 1): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  function promotionDates(
    startDaysFromNow: number = -1,
    endDaysFromNow: number = 30,
  ): { validFrom: string; validUntil: string } {
    const validFrom = new Date();
    validFrom.setDate(validFrom.getDate() + startDaysFromNow);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + endDaysFromNow);

    return { validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString() };
  }

  function pastPromotionDates(): { validFrom: string; validUntil: string } {
    const validFrom = new Date();
    validFrom.setDate(validFrom.getDate() - 30);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() - 1);
    return { validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString() };
  }

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

  describe("Warehouse API", () => {
    describe("POST /warehouse/stock/add", () => {
      it("creates inventory item when adding stock to new SKU", async () => {
        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 50 },
        });

        expect(response.statusCode).toBe(204);

        const inventoryResponse = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
        });
        expect(inventoryResponse.json().quantity).toBe(50);
      });

      it("increases quantity when adding stock to existing SKU", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 30 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 20 },
        });

        const inventoryResponse = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
        });
        expect(inventoryResponse.json().quantity).toBe(50);
      });

      it("rejects adding zero quantity", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 10 },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 0 },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toBe("Cannot add zero quantity");
      });
    });

    describe("POST /warehouse/stock/remove", () => {
      it("decreases quantity when removing stock", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 50 },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/remove",
          payload: { sku: "APPLE-001", quantity: 20 },
        });

        expect(response.statusCode).toBe(204);

        const inventoryResponse = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
        });
        expect(inventoryResponse.json().quantity).toBe(30);
      });

      it("rejects removing from non-existent SKU", async () => {
        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/remove",
          payload: { sku: "UNKNOWN", quantity: 10 },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toContain("Inventory item not found");
      });

      it("rejects removing more than available", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 5 },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/remove",
          payload: { sku: "APPLE-001", quantity: 10 },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toBe("Insufficient available stock");
      });

      it("prevents removing stock that is reserved", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 10 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 8,
            expiresAt: futureDate(),
          },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/stock/remove",
          payload: { sku: "APPLE-001", quantity: 5 },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toBe("Insufficient available stock");
      });
    });

    describe("POST /warehouse/reservations", () => {
      it("creates reservation and returns confirmation", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 50 },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
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
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 50 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 10,
            expiresAt: futureDate(),
          },
        });

        const inventoryResponse = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
        });
        expect(inventoryResponse.json().quantity).toBe(50);
        expect(inventoryResponse.json().availableQuantity).toBe(40);
      });

      it("rejects reservation exceeding available quantity", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 5 },
        });

        const response = await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 10,
            expiresAt: futureDate(),
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toBe("Insufficient available stock for reservation");
      });
    });

    describe("DELETE /warehouse/reservations/:sku/:reservationId", () => {
      it("restores available quantity after releasing reservation", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 50 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 10,
            expiresAt: futureDate(),
          },
        });

        const response = await app.inject({
          method: "DELETE",
          url: "/warehouse/reservations/APPLE-001/RES-001",
        });

        expect(response.statusCode).toBe(204);

        const inventoryResponse = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
        });
        expect(inventoryResponse.json().availableQuantity).toBe(50);
      });
    });

    describe("GET /warehouse/inventory/:sku", () => {
      it("returns inventory item details", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 20,
            expiresAt: futureDate(),
          },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/inventory/APPLE-001",
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
          url: "/warehouse/inventory/UNKNOWN",
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toBe("Inventory item not found");
      });
    });

    describe("GET /warehouse/availability/:sku", () => {
      it("returns HIGH availability for well-stocked item", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/APPLE-001",
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().level).toBe("HIGH");
        expect(response.json().isLow).toBe(false);
        expect(response.json().isOutOfStock).toBe(false);
      });

      it("returns LOW availability for low stock", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 3 },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/APPLE-001",
        });

        expect(response.json().level).toBe("LOW");
        expect(response.json().isLow).toBe(true);
      });

      it("returns OUT_OF_STOCK for unknown SKU", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/UNKNOWN",
        });

        expect(response.json().level).toBe("OUT_OF_STOCK");
        expect(response.json().isOutOfStock).toBe(true);
      });

      it("considers reservations when calculating availability level", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 20 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 18,
            expiresAt: futureDate(),
          },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/APPLE-001",
        });

        expect(response.json().level).toBe("LOW");
        expect(response.json().isLow).toBe(true);
      });

      it("returns OUT_OF_STOCK when all stock is reserved", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 10 },
        });

        await app.inject({
          method: "POST",
          url: "/warehouse/reservations",
          payload: {
            sku: "APPLE-001",
            reservationId: "RES-001",
            quantity: 10,
            expiresAt: futureDate(),
          },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/APPLE-001",
        });

        expect(response.json().level).toBe("OUT_OF_STOCK");
        expect(response.json().isOutOfStock).toBe(true);
      });

      it("does not expose inventory internals in availability signal", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        const response = await app.inject({
          method: "GET",
          url: "/warehouse/availability/APPLE-001",
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
  });

  describe("Pricing API", () => {
    describe("POST /pricing/base-price", () => {
      it("creates price entry for new SKU", async () => {
        const response = await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        expect(response.statusCode).toBe(204);

        const entryResponse = await app.inject({
          method: "GET",
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().basePriceInCents).toBe(999);
      });

      it("updates base price for existing SKU", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1299 },
        });

        const entryResponse = await app.inject({
          method: "GET",
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().basePriceInCents).toBe(1299);
      });

      it("rejects zero base price", async () => {
        const response = await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 0 },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error).toBe("Base price cannot be zero");
      });

      it("uses USD as default currency", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        const entryResponse = await app.inject({
          method: "GET",
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().currency).toBe("USD");
      });

      it("accepts custom currency", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999, currency: "EUR" },
        });

        const entryResponse = await app.inject({
          method: "GET",
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().currency).toBe("EUR");
      });
    });

    describe("POST /pricing/promotions", () => {
      it("adds promotion to existing price entry", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        const { validFrom, validUntil } = promotionDates();
        const response = await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().promotions).toHaveLength(1);
        expect(entryResponse.json().promotions[0].name).toBe("Black Friday");
      });

      it("rejects promotion for non-existent SKU", async () => {
        const { validFrom, validUntil } = promotionDates();
        const response = await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/promotions",
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

    describe("DELETE /pricing/promotions/:sku/:promotionName", () => {
      it("removes promotion from price entry", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 999 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/promotions/APPLE-001/Black Friday",
        });

        expect(response.statusCode).toBe(204);

        const entryResponse = await app.inject({
          method: "GET",
          url: "/pricing/entries/APPLE-001",
        });
        expect(entryResponse.json().promotions).toHaveLength(0);
      });
    });

    describe("GET /pricing/entries/:sku", () => {
      it("returns price entry with promotions", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/entries/APPLE-001",
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
          url: "/pricing/entries/UNKNOWN",
        });

        expect(response.statusCode).toBe(404);
        expect(response.json().error).toBe("Price entry not found");
      });
    });

    describe("GET /pricing/calculate/:sku", () => {
      it("returns base price when no promotions exist", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const response = await app.inject({
          method: "GET",
          url: "/pricing/calculate/APPLE-001",
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().basePriceInCents).toBe(1000);
        expect(response.json().finalPriceInCents).toBe(1000);
        expect(response.json().appliedDiscounts).toHaveLength(0);
      });

      it("applies full discount when stock is high", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/calculate/APPLE-001",
        });

        expect(response.json().finalPriceInCents).toBe(800);
        expect(response.json().totalDiscountPercentage).toBe(20);
        expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(20);
        expect(response.json().appliedDiscounts[0].reason).toBe("Full discount applied");
      });

      it("reduces discount by 50% when stock is low", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 3 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/calculate/APPLE-001",
        });

        expect(response.json().finalPriceInCents).toBe(900);
        expect(response.json().appliedDiscounts[0].originalPercentage).toBe(20);
        expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(10);
        expect(response.json().appliedDiscounts[0].reason).toBe("Reduced discount: low stock");
      });

      it("applies no discount when out of stock", async () => {
        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = promotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/calculate/APPLE-001",
        });

        expect(response.json().finalPriceInCents).toBe(1000);
        expect(response.json().appliedDiscounts[0].appliedPercentage).toBe(0);
        expect(response.json().appliedDiscounts[0].reason).toBe("No discount: item out of stock");
      });

      it("ignores inactive promotions", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = pastPromotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: "/pricing/calculate/APPLE-001",
        });

        expect(response.json().finalPriceInCents).toBe(1000);
        expect(response.json().appliedDiscounts).toHaveLength(0);
      });

      it("supports date parameter for historical calculation", async () => {
        await app.inject({
          method: "POST",
          url: "/warehouse/stock/add",
          payload: { sku: "APPLE-001", quantity: 100 },
        });

        await app.inject({
          method: "POST",
          url: "/pricing/base-price",
          payload: { sku: "APPLE-001", priceInCents: 1000 },
        });

        const { validFrom, validUntil } = pastPromotionDates();
        await app.inject({
          method: "POST",
          url: "/pricing/promotions",
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
          url: `/pricing/calculate/APPLE-001?at=${pastDate.toISOString()}`,
        });

        expect(response.json().finalPriceInCents).toBe(850);
        expect(response.json().appliedDiscounts).toHaveLength(1);
      });
    });
  });

  describe("Cross-Context Integration", () => {
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
