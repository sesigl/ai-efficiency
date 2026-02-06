import type { InventoryRepository } from "./inventory-repository.js";

export interface PhysicalCountResult {
  sku: string;
  previousQuantity: number;
  newQuantity: number;
  delta: number;
}

export class PhysicalCountUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(sku: string, quantity: number): PhysicalCountResult {
    const item = this.inventoryRepository.getOrCreate(sku, 0);
    const previousQuantity = item.getQuantity();
    const delta = item.setQuantity(quantity);

    return {
      sku,
      previousQuantity,
      newQuantity: quantity,
      delta,
    };
  }
}
