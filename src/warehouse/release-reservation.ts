import type { InventoryRepository } from "./inventory-repository.js";

export class ReleaseReservation {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, reservationId: string): void {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    item.releaseReservation(reservationId);
    this.inventoryRepository.save(item);
  }
}
