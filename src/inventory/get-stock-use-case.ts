import type { InventoryRepository } from "./inventory-repository.js";
import type { Reservation } from "./inventory-item.js";

export interface StockDetails {
  sku: string;
  quantity: number;
  availableQuantity: number;
  reservations: Reservation[];
}

export class GetStockUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string): StockDetails {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    return {
      sku: item.sku,
      quantity: item.getQuantity(),
      availableQuantity: item.getAvailableQuantity(),
      reservations: item.getReservations(),
    };
  }
}
