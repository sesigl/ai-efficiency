import type { InventoryRepository } from "./inventory-repository.js";

export type AvailabilityLevel = "HIGH" | "LOW" | "OUT_OF_STOCK";

export interface AvailabilitySignal {
  sku: string;
  level: AvailabilityLevel;
  isLow: boolean;
  isOutOfStock: boolean;
}

export class CheckAvailability {
  private static readonly LOW_STOCK_THRESHOLD = 5;

  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string): AvailabilitySignal {
    const item = this.inventoryRepository.findBySku(sku);
    const availableQuantity = item?.availableQuantity ?? 0;

    let level: AvailabilityLevel;
    if (availableQuantity === 0) {
      level = "OUT_OF_STOCK";
    } else if (availableQuantity < CheckAvailability.LOW_STOCK_THRESHOLD) {
      level = "LOW";
    } else {
      level = "HIGH";
    }

    return {
      sku,
      level,
      isLow: level === "LOW",
      isOutOfStock: level === "OUT_OF_STOCK",
    };
  }
}
