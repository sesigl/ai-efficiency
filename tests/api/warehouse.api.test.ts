import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createTestApp, futureDate } from "./test-utils.js";

describe("Warehouse API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

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
