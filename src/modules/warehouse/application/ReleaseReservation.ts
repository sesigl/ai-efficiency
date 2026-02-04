import type { InventoryRepository } from "../domain/InventoryRepository.js";
import { SKU } from "../domain/SKU.js";

export interface ReleaseReservationCommand {
  sku: string;
  reservationId: string;
}

export class ReleaseReservation {
  constructor(private readonly repository: InventoryRepository) {}

  execute(command: ReleaseReservationCommand): void {
    const sku = SKU.create(command.sku);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.releaseReservation(command.reservationId);
    this.repository.save(item);
  }
}
