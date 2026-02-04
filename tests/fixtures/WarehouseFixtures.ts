import {
  createWarehouseContainer,
  type WarehouseContainer,
} from "../../src/modules/warehouse/di.js";
import { InMemoryInventoryRepository } from "../../src/modules/warehouse/infrastructure/InMemoryInventoryRepository.js";

export function createTestWarehouseContainer(): WarehouseContainer & {
  clearRepository: () => void;
} {
  const repository = new InMemoryInventoryRepository();
  const container = createWarehouseContainer(repository);
  return {
    ...container,
    clearRepository: () => repository.clear(),
  };
}

export function futureDate(daysFromNow: number = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
