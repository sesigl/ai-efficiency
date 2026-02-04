import type { InventoryRepository } from "./domain/InventoryRepository.js";
import { AddStock } from "./application/AddStock.js";
import { RemoveStock } from "./application/RemoveStock.js";
import { ReserveStock } from "./application/ReserveStock.js";
import { ReleaseReservation } from "./application/ReleaseReservation.js";
import { GetAvailability } from "./application/GetAvailability.js";
import { GetInventoryItem } from "./application/GetInventoryItem.js";
import { createWarehouseInfrastructure } from "./infrastructure/di.js";

export interface WarehouseContainer {
  repository: InventoryRepository;
  addStock: AddStock;
  removeStock: RemoveStock;
  reserveStock: ReserveStock;
  releaseReservation: ReleaseReservation;
  getAvailability: GetAvailability;
  getInventoryItem: GetInventoryItem;
}

export function createWarehouseContainer(repository?: InventoryRepository): WarehouseContainer {
  const infra = createWarehouseInfrastructure();
  const repo = repository ?? infra.repository;

  return {
    repository: repo,
    addStock: new AddStock(repo),
    removeStock: new RemoveStock(repo),
    reserveStock: new ReserveStock(repo),
    releaseReservation: new ReleaseReservation(repo),
    getAvailability: new GetAvailability(repo),
    getInventoryItem: new GetInventoryItem(repo),
  };
}
