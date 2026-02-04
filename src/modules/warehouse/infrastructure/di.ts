import type { InventoryItemRepository } from "../domain/InventoryItemRepository.js";
import { InMemoryInventoryItemRepository } from "./InMemoryInventoryItemRepository.js";

export function createInventoryItemRepository(): InventoryItemRepository {
  return new InMemoryInventoryItemRepository();
}
