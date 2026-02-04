import { InventoryRepository, SKU, Quantity } from '../domain/index.js';

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
