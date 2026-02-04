import type { InventoryRepository } from "../domain/InventoryRepository.js";
import { SKU } from "../domain/SKU.js";
import { Quantity } from "../domain/Quantity.js";

export interface RemoveStockCommand {
  sku: string;
  quantity: number;
}

export class RemoveStock {
  constructor(private readonly repository: InventoryRepository) {}

  execute(command: RemoveStockCommand): void {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);

    const item = this.repository.findBySku(sku);

    if (!item) {
      throw new Error(`Inventory item not found: ${command.sku}`);
    }

    item.removeStock(quantity);
    this.repository.save(item);
  }
}
