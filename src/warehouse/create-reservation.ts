import type { InventoryRepository } from "./inventory-repository.js";

export interface ReservationConfirmation {
  reservationId: string;
  quantity: number;
}

export class CreateReservation {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(
    sku: string,
    reservationId: string,
    quantity: number,
    expiresAt: string,
  ): ReservationConfirmation {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    item.createReservation(reservationId, quantity, expiresAt);
    this.inventoryRepository.save(item);
    return { reservationId, quantity };
  }
}
