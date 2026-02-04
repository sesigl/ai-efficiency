import { InventoryUseCases } from "../application/inventory/InventoryUseCases.js";
import { ReservationUseCases } from "../application/reservations/ReservationUseCases.js";
import type { InventoryItemRepository } from "../domain/InventoryItemRepository.js";
import { InMemoryInventoryItemRepository } from "./InMemoryInventoryItemRepository.js";

export interface WarehouseUseCases {
  repository: InventoryItemRepository;
  inventory: InventoryUseCases;
  reservations: ReservationUseCases;
}

export function createWarehouseUseCases(
  repository?: InventoryItemRepository,
): WarehouseUseCases {
  const repo = repository ?? new InMemoryInventoryItemRepository();

  return {
    repository: repo,
    inventory: new InventoryUseCases(repo),
    reservations: new ReservationUseCases(repo),
  };
}
