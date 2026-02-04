import type { InventoryItemRepository } from "../../domain/InventoryItemRepository.js";
import { Quantity } from "../../domain/Quantity.js";
import { SKU } from "../../domain/Sku.js";

export interface ReserveStockCommand {
  sku: string;
  reservationId: string;
  quantity: number;
  expiresAt: Date;
}

export interface ReserveStockResult {
  reservationId: string;
  sku: string;
  quantity: number;
  expiresAt: Date;
}

export interface ReleaseReservationCommand {
  sku: string;
  reservationId: string;
}

export class ReservationUseCases {
  constructor(private readonly repository: InventoryItemRepository) {}

  reserveStock(command: ReserveStockCommand): ReserveStockResult {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    const reservation = item.reserve(command.reservationId, quantity, command.expiresAt);
    this.repository.save(item);

    return {
      reservationId: reservation.getId(),
      sku: command.sku,
      quantity: reservation.getQuantity().toNumber(),
      expiresAt: reservation.getExpiresAt(),
    };
  }

  releaseReservation(command: ReleaseReservationCommand): void {
    const sku = SKU.create(command.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.releaseReservation(command.reservationId);
    this.repository.save(item);
  }
}
