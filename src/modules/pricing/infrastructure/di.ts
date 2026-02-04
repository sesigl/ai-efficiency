import type { PriceEntryRepository } from "../domain/PriceEntryRepository.js";
import { InMemoryPriceEntryRepository } from "./InMemoryPriceEntryRepository.js";

export function createPriceEntryRepository(): PriceEntryRepository {
  return new InMemoryPriceEntryRepository();
}
