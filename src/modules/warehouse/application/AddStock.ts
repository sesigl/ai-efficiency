import type { InventoryRepository } from "../domain/InventoryRepository.js";
import { SKU } from "../domain/SKU.js";
import { Quantity } from "../domain/Quantity.js";
import { InventoryItem } from "../domain/InventoryItem.js";

export interface AddStockCommand {
  sku: string;
  quantity: number;
}

export class AddStock {
  constructor(private readonly repository: InventoryRepository) {}

  execute(command: AddStockCommand): void {
    const sku = SKU.create(command.sku);
    const quantity = Quantity.create(command.quantity);

    let item = this.repository.findBySku(sku);

    if (!item) {
      item = InventoryItem.create(sku, Quantity.zero());
    }

    item.addStock(quantity);
    this.repository.save(item);
  }
}
