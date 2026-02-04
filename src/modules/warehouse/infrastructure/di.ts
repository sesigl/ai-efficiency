import type { InventoryRepository } from "../domain/InventoryRepository.js";
import { InMemoryInventoryRepository } from "./InMemoryInventoryRepository.js";

export interface WarehouseInfrastructure {
  repository: InventoryRepository;
}

export function createWarehouseInfrastructure(): WarehouseInfrastructure {
  return {
    repository: new InMemoryInventoryRepository(),
  };
}
