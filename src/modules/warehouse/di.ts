import type { InventoryRepository } from "./domain/index.js";
import {
  AddStock,
  RemoveStock,
  ReserveStock,
  ReleaseReservation,
  GetAvailability,
  GetInventoryItem,
} from "./application/index.js";
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
