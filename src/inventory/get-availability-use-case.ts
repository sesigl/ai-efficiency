import type { InventoryRepository } from "./inventory-repository.js";

type AvailabilityLevel = "HIGH" | "LOW" | "OUT_OF_STOCK";

export interface AvailabilityDetails {
  sku: string;
  level: AvailabilityLevel;
  isLow: boolean;
  isOutOfStock: boolean;
}

export class GetAvailabilityUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string): AvailabilityDetails {
    const item = this.inventoryRepository.findBySku(sku);

    if (!item) {
      return {
        sku,
        level: "OUT_OF_STOCK",
        isLow: false,
        isOutOfStock: true,
      };
    }

    const availableQuantity = item.getAvailableQuantity();

    if (availableQuantity === 0) {
      return {
        sku,
        level: "OUT_OF_STOCK",
        isLow: false,
        isOutOfStock: true,
      };
    }

    if (availableQuantity <= 5) {
      return {
        sku,
        level: "LOW",
        isLow: true,
        isOutOfStock: false,
      };
    }

    return {
      sku,
      level: "HIGH",
      isLow: false,
      isOutOfStock: false,
    };
  }
}
