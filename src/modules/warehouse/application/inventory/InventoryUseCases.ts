import {
  type AvailabilitySignal,
  createAvailabilitySignal,
} from "../../../../shared/contract/warehouse/AvailabilitySignal.js";
import { InventoryItem } from "../../domain/InventoryItem.js";
import type { InventoryItemRepository } from "../../domain/InventoryItemRepository.js";
import { Quantity } from "../../domain/Quantity.js";
import { SKU } from "../../domain/SKU.js";

export interface AddStockCommand {
  sku: string;
  quantity: number;
}

export interface RemoveStockCommand {
  sku: string;
  quantity: number;
}

export interface GetInventoryItemQuery {
  sku: string;
}

export interface GetAvailabilityQuery {
  sku: string;
}

export interface InventoryItemDTO {
  sku: string;
  quantity: number;
  availableQuantity: number;
  reservations: ReservationDTO[];
}

interface ReservationDTO {
  id: string;
  quantity: number;
  expiresAt: Date;
}

export class InventoryUseCases {
  constructor(private readonly repository: InventoryItemRepository) {}

  addStock(command: AddStockCommand): void {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);

    let item = this.repository.findBySku(sku);

    if (!item) {
      item = InventoryItem.create(sku, Quantity.zero());
    }

    item.addStock(quantity);
    this.repository.save(item);
  }

  removeStock(command: RemoveStockCommand): void {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.removeStock(quantity);
    this.repository.save(item);
  }

  getInventoryItem(query: GetInventoryItemQuery): InventoryItemDTO | undefined {
    const sku = SKU.create(query.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      return undefined;
    }

    return {
      sku: item.getSku().toString(),
      quantity: item.getQuantity().toNumber(),
      availableQuantity: item.getAvailableQuantity().toNumber(),
      reservations: item.getReservations().map((reservation) => ({
        id: reservation.getId(),
        quantity: reservation.getQuantity().toNumber(),
        expiresAt: reservation.getExpiresAt(),
      })),
    };
  }

  getAvailability(query: GetAvailabilityQuery): AvailabilitySignal {
    const sku = SKU.create(query.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      return createAvailabilitySignal(query.sku, "OUT_OF_STOCK");
    }

    return item.toAvailabilitySignal();
  }
}
