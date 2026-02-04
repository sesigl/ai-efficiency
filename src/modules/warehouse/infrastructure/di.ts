import { InventoryRepository } from '../domain/index.js';
import {
  AddStock,
  RemoveStock,
  ReserveStock,
  ReleaseReservation,
  GetAvailability,
  GetInventoryItem,
} from '../application/index.js';
import { InMemoryInventoryRepository } from './InMemoryInventoryRepository.js';

export interface WarehouseContainer {
  repository: InventoryRepository;
  addStock: AddStock;
  removeStock: RemoveStock;
  reserveStock: ReserveStock;
  releaseReservation: ReleaseReservation;
  getAvailability: GetAvailability;
  getInventoryItem: GetInventoryItem;
}

export function createWarehouseContainer(
  repository: InventoryRepository = new InMemoryInventoryRepository()
): WarehouseContainer {
  return {
    repository,
    addStock: new AddStock(repository),
    removeStock: new RemoveStock(repository),
    reserveStock: new ReserveStock(repository),
    releaseReservation: new ReleaseReservation(repository),
    getAvailability: new GetAvailability(repository),
    getInventoryItem: new GetInventoryItem(repository),
  };
}
