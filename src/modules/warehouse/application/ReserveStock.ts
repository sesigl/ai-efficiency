import { InventoryRepository, SKU, Quantity } from '../domain/index.js';

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

export class ReserveStock {
  constructor(private readonly repository: InventoryRepository) {}

  execute(command: ReserveStockCommand): ReserveStockResult {
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
}
