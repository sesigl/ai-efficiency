import type { InventoryRepository } from "./inventory-repository.js";
import type { Reservation } from "./inventory-item.js";

export interface InventoryDetails {
  sku: string;
  quantity: number;
  availableQuantity: number;
  reservations: Reservation[];
}

export class GetInventory {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string): InventoryDetails {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    return {
      sku: item.sku,
      quantity: item.quantity,
      availableQuantity: item.availableQuantity,
      reservations: item.reservations,
    };
  }
}
