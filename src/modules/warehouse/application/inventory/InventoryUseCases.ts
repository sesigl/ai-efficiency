import {
  type AvailabilitySignal,
  createAvailabilitySignal,
} from "../../../../shared/contract/warehouse/AvailabilitySignal.js";
import { InventoryItem } from "../../domain/inventory-item/InventoryItem.js";
import type { InventoryItemRepository } from "../../domain/inventory-item/InventoryItemRepository.js";
import { Quantity } from "../../domain/inventory-item/Quantity.js";
import { validateShrinkageReason } from "../../domain/inventory-item/ShrinkageReason.js";
import { SKU } from "../../domain/inventory-item/Sku.js";

export interface AddStockCommand {
  sku: string;
  quantity: number;
}

export interface RemoveStockCommand {
  sku: string;
  quantity: number;
}

export interface AdjustStockAfterCountCommand {
  sku: string;
  count: number;
}

export interface AdjustStockAfterCountResult {
  delta: number;
}

export interface SetReorderThresholdCommand {
  sku: string;
  threshold: number;
}

export interface RecordShrinkageCommand {
  sku: string;
  quantity: number;
  reason: string;
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

export interface ReorderItemDTO {
  sku: string;
  availableQuantity: number;
  reorderThreshold: number;
}

export interface InventorySummaryDTO {
  totalSkus: number;
  totalUnits: number;
  itemsNeedingReorder: number;
  outOfStockItems: number;
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

  adjustStockAfterCount(command: AdjustStockAfterCountCommand): AdjustStockAfterCountResult {
    const sku = SKU.create(command.sku);
    const newCount = Quantity.create(command.count);

    let item = this.repository.findBySku(sku);

    if (!item) {
      item = InventoryItem.create(sku, Quantity.zero());
    }

    const delta = item.adjustToCount(newCount);
    this.repository.save(item);

    return { delta };
  }

  setReorderThreshold(command: SetReorderThresholdCommand): void {
    const sku = SKU.create(command.sku);
    const threshold = Quantity.create(command.threshold);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.setReorderThreshold(threshold);
    this.repository.save(item);
  }

  listItemsNeedingReorder(): ReorderItemDTO[] {
    const allItems = this.repository.findAll();

    return allItems
      .filter((item) => item.needsReorder())
      .map((item) => ({
        sku: item.getSku().toString(),
        availableQuantity: item.getAvailableQuantity().toNumber(),
        reorderThreshold: item.getReorderThreshold()!.toNumber(),
      }));
  }

  recordShrinkage(command: RecordShrinkageCommand): void {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);
    const reason = validateShrinkageReason(command.reason);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.recordShrinkage(quantity, reason);
    this.repository.save(item);
  }

  getInventorySummary(): InventorySummaryDTO {
    const allItems = this.repository.findAll();

    return {
      totalSkus: allItems.length,
      totalUnits: allItems.reduce((sum, item) => sum + item.getQuantity().toNumber(), 0),
      itemsNeedingReorder: allItems.filter((item) => item.needsReorder()).length,
      outOfStockItems: allItems.filter((item) => item.getQuantity().isZero()).length,
    };
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
