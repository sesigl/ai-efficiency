import { describe, it, expect } from "vitest";
import { createTestWarehouseUseCases, futureDate } from "../../../fixtures/WarehouseFixtures.js";

describe("Warehouse Use Cases", () => {
  const createUseCases = () => createTestWarehouseUseCases();

  describe("AddStock", () => {
    it("creates inventory item when adding stock to new SKU", () => {
      const { inventory } = createUseCases();

      inventory.addStock({ sku: "APPLE-001", quantity: 50 });

      const item = inventory.getInventoryItem({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(50);
    });

    it("increases quantity when adding stock to existing SKU", () => {
      const { inventory } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 30 });

      inventory.addStock({ sku: "APPLE-001", quantity: 20 });

      const item = inventory.getInventoryItem({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(50);
    });
  });

  describe("RemoveStock", () => {
    it("decreases quantity when removing stock", () => {
      const { inventory } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 50 });

      inventory.removeStock({ sku: "APPLE-001", quantity: 20 });

      const item = inventory.getInventoryItem({ sku: "APPLE-001" });
      expect(item?.quantity).toBe(30);
    });

    it("rejects removing from non-existent SKU", () => {
      const { inventory } = createUseCases();

      expect(() => inventory.removeStock({ sku: "UNKNOWN", quantity: 10 })).toThrow(
        "Inventory item not found",
      );
    });
  });

  describe("ReserveStock", () => {
    it("creates reservation and returns confirmation", () => {
      const { inventory, reservations } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 50 });

      const result = reservations.reserveStock({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 10,
        expiresAt: futureDate(),
      });

      expect(result.reservationId).toBe("RES-001");
      expect(result.quantity).toBe(10);
      const item = inventory.getInventoryItem({ sku: "APPLE-001" });
      expect(item?.availableQuantity).toBe(40);
    });
  });

  describe("ReleaseReservation", () => {
    it("restores available quantity after releasing reservation", () => {
      const { inventory, reservations } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 50 });
      reservations.reserveStock({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 10,
        expiresAt: futureDate(),
      });

      reservations.releaseReservation({ sku: "APPLE-001", reservationId: "RES-001" });

      const item = inventory.getInventoryItem({ sku: "APPLE-001" });
      expect(item?.availableQuantity).toBe(50);
    });
  });

  describe("GetAvailability", () => {
    it("returns HIGH availability for well-stocked item", () => {
      const { inventory } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 100 });

      const signal = inventory.getAvailability({ sku: "APPLE-001" });

      expect(signal.level).toBe("HIGH");
      expect(signal.isLow).toBe(false);
    });

    it("returns OUT_OF_STOCK for unknown SKU", () => {
      const { inventory } = createUseCases();

      const signal = inventory.getAvailability({ sku: "UNKNOWN" });

      expect(signal.level).toBe("OUT_OF_STOCK");
      expect(signal.isOutOfStock).toBe(true);
    });

    it("returns LOW availability when most stock is reserved", () => {
      const { inventory, reservations } = createUseCases();
      inventory.addStock({ sku: "APPLE-001", quantity: 20 });
      reservations.reserveStock({
        sku: "APPLE-001",
        reservationId: "RES-001",
        quantity: 18,
        expiresAt: futureDate(),
      });

      const signal = inventory.getAvailability({ sku: "APPLE-001" });

      expect(signal.level).toBe("LOW");
      expect(signal.isLow).toBe(true);
    });
  });
});
