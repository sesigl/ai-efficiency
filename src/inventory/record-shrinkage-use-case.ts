import type { ShrinkageReason } from "./inventory-item.js";
import type { InventoryRepository } from "./inventory-repository.js";

export interface RecordShrinkageResult {
  sku: string;
  quantity: number;
  reason: ShrinkageReason;
}

export class RecordShrinkageUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, quantity: number, reason: ShrinkageReason): RecordShrinkageResult {
    const item = this.inventoryRepository.findBySku(sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    item.recordShrinkage(quantity, reason);

    return { sku, quantity, reason };
  }
}
