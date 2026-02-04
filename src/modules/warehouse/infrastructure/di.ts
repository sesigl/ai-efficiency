import { InventoryUseCases } from "../application/inventory/InventoryUseCases.js";
import { ReservationUseCases } from "../application/reservations/ReservationUseCases.js";
import type { InventoryRepository } from "../domain/InventoryRepository.js";
import { InMemoryInventoryRepository } from "./InMemoryInventoryRepository.js";

export interface WarehouseUseCases {
  repository: InventoryRepository;
  inventory: InventoryUseCases;
  reservations: ReservationUseCases;
}

export function createWarehouseUseCases(repository?: InventoryRepository): WarehouseUseCases {
  const repo = repository ?? new InMemoryInventoryRepository();

  return {
    repository: repo,
    inventory: new InventoryUseCases(repo),
    reservations: new ReservationUseCases(repo),
  };
}
