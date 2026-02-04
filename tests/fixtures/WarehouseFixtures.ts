import {
  createWarehouseUseCases,
  type WarehouseUseCases,
} from "../../src/modules/warehouse/infrastructure/di.js";
import { InMemoryInventoryItemRepository } from "../../src/modules/warehouse/infrastructure/InMemoryInventoryItemRepository.js";

export function createTestWarehouseUseCases(): WarehouseUseCases & {
  clearRepository: () => void;
} {
  const repository = new InMemoryInventoryItemRepository();
  const useCases = createWarehouseUseCases(repository);
  return {
    ...useCases,
    clearRepository: () => repository.clear(),
  };
}

export function futureDate(daysFromNow: number = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
