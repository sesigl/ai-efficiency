import { describe, it, expect } from "vitest";
import { createTestWarehouseContainer, futureDate } from "../../../fixtures/WarehouseFixtures.js";

describe("Warehouse Use Cases", () => {
  const createContainer = () => createTestWarehouseContainer();

  describe("AddStock", () => {
    it("creates inventory item when adding stock to new SKU", () => {
      const { addStock, getInventoryItem } = createContainer();

      addStock.execute({ sku: "APPLE-001", quantity: 50 });

      const item = getInventoryItem.execute({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(50);
    });

    it("increases quantity when adding stock to existing SKU", () => {
      const { addStock, getInventoryItem } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 30 });

      addStock.execute({ sku: "APPLE-001", quantity: 20 });

      const item = getInventoryItem.execute({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(50);
    });
  });

  describe("RemoveStock", () => {
    it("decreases quantity when removing stock", () => {
      const { addStock, removeStock, getInventoryItem } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 50 });

      removeStock.execute({ sku: "APPLE-001", quantity: 20 });

      const item = getInventoryItem.execute({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(30);
    });

    it("rejects removing from non-existent SKU", () => {
      const { removeStock } = createContainer();

      expect(() => removeStock.execute({ sku: "UNKNOWN", quantity: 10 })).toThrow(
        "Inventory item not found",
      );
    });
  });

  describe("ReserveStock", () => {
    it("creates reservation and returns confirmation", () => {
      const { addStock, reserveStock, getInventoryItem } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 50 });

      const result = reserveStock.execute({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 10,
        expiresAt: futureDate(),
      });

      expect(result.reservationId).toBe("RES-001");
      expect(result.quantity).toBe(10);
      const item = getInventoryItem.execute({ sku: "APPLE-001" });
      expect(item?.availableQuantity).toBe(40);
    });
  });

  describe("ReleaseReservation", () => {
    it("restores available quantity after releasing reservation", () => {
      const { addStock, reserveStock, releaseReservation, getInventoryItem } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 50 });
      reserveStock.execute({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 10,
        expiresAt: futureDate(),
      });

      releaseReservation.execute({ sku: "APPLE-001", reservationId: "RES-001" });

      const item = getInventoryItem.execute({ sku: "APPLE-001" });
      expect(item?.availableQuantity).toBe(50);
    });
  });

  describe("GetAvailability", () => {
    it("returns HIGH availability for well-stocked item", () => {
      const { addStock, getAvailability } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 100 });

      const signal = getAvailability.execute({ sku: "APPLE-001" });

      expect(signal.level).toBe("HIGH");
      expect(signal.isLow).toBe(false);
    });

    it("returns OUT_OF_STOCK for unknown SKU", () => {
      const { getAvailability } = createContainer();

      const signal = getAvailability.execute({ sku: "UNKNOWN" });

      expect(signal.level).toBe("OUT_OF_STOCK");
      expect(signal.isOutOfStock).toBe(true);
    });

    it("returns LOW availability when most stock is reserved", () => {
      const { addStock, reserveStock, getAvailability } = createContainer();
      addStock.execute({ sku: "APPLE-001", quantity: 20 });
      reserveStock.execute({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 18,
        expiresAt: futureDate(),
      });

      const signal = getAvailability.execute({ sku: "APPLE-001" });

      expect(signal.level).toBe("LOW");
      expect(signal.isLow).toBe(true);
    });
  });
});
