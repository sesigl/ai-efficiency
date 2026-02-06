import {
  type AvailabilitySignal,
  createAvailabilitySignal,
} from "../../../../shared/contract/warehouse/AvailabilitySignal.js";
import { InventoryItem } from "../../domain/inventory-item/InventoryItem.js";
import type { InventoryItemRepository } from "../../domain/inventory-item/InventoryItemRepository.js";
import { Quantity } from "../../domain/inventory-item/Quantity.js";
import type { ShrinkageReason } from "../../domain/inventory-item/ShrinkageReason.js";
import { SKU } from "../../domain/inventory-item/Sku.js";

export interface AddStockCommand {
  sku: string;
  quantity: number;
}

export interface RemoveStockCommand {
  sku: string;
  quantity: number;
}

export interface AdjustStockCommand {
  sku: string;
  quantity: number;
}

export interface AdjustStockResult {
  delta: number;
}

export interface SetReorderThresholdCommand {
  sku: string;
  threshold: number;
}

export interface RecordShrinkageCommand {
  sku: string;
  quantity: number;
  reason: ShrinkageReason;
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
  needsReorder: boolean;
  shrinkage: Record<string, number>;
}

interface ReservationDTO {
  id: string;
  quantity: number;
  expiresAt: Date;
}

export interface ReorderNeededItemDTO {
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

  adjustStockAfterPhysicalCount(command: AdjustStockCommand): AdjustStockResult {
    const sku = SKU.create(command.sku);
    const newQuantity = Quantity.create(command.quantity);

    let item = this.repository.findBySku(sku);

    if (!item) {
      item = InventoryItem.create(sku, Quantity.zero());
    }

    const delta = item.adjustToCount(newQuantity);
    this.repository.save(item);

    return { delta };
  }

  setReorderThreshold(command: SetReorderThresholdCommand): void {
    const sku = SKU.create(command.sku);
    const threshold = Quantity.create(command.threshold);

    let item = this.repository.findBySku(sku);

    if (!item) {
      item = InventoryItem.create(sku, Quantity.zero());
    }

    item.setReorderThreshold(threshold);
    this.repository.save(item);
  }

  listItemsNeedingReorder(): ReorderNeededItemDTO[] {
    return this.repository
      .findAll()
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

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.recordShrinkage(quantity, command.reason);
    this.repository.save(item);
  }

  getInventorySummary(): InventorySummaryDTO {
    const items = this.repository.findAll();

    return {
      totalSkus: items.length,
      totalUnits: items.reduce((sum, item) => sum + item.getQuantity().toNumber(), 0),
      itemsNeedingReorder: items.filter((item) => item.needsReorder()).length,
      outOfStockItems: items.filter((item) => item.getQuantity().isZero()).length,
    };
  }

  getInventoryItem(query: GetInventoryItemQuery): InventoryItemDTO | undefined {
    const sku = SKU.create(query.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      return undefined;
    }

    const shrinkageRecords = item.getShrinkageRecords();
    const shrinkage: Record<string, number> = {};
    for (const [reason, qty] of shrinkageRecords) {
      shrinkage[reason] = qty;
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
      needsReorder: item.needsReorder(),
      shrinkage,
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
