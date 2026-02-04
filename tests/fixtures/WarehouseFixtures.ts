import { createWarehouseUseCases, type WarehouseUseCases } from "../../src/modules/warehouse/di.js";
import { InMemoryInventoryRepository } from "../../src/modules/warehouse/infrastructure/InMemoryInventoryRepository.js";

export function createTestWarehouseUseCases(): WarehouseUseCases & {
  clearRepository: () => void;
} {
  const repository = new InMemoryInventoryRepository();
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
