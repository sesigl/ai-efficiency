import type { InventoryRepository } from "./inventory-repository.js";

export class ReleaseReservationUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, reservationId: string): void {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      return;
    }

    item.releaseReservation(reservationId);
  }
}
