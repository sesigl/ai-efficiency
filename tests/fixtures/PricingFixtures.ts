import { createPricingUseCases, type PricingUseCases } from "../../src/modules/pricing/di.js";
import type { PromotionType } from "../../src/modules/pricing/domain/Promotion.js";
import { InMemoryPriceRepository } from "../../src/modules/pricing/infrastructure/InMemoryPriceRepository.js";
import type { AvailabilityFetcher } from "../../src/modules/pricing/infrastructure/WarehouseAvailabilityAdapter.js";
import {
  type AvailabilitySignal,
  createAvailabilitySignal,
  type AvailabilityLevel,
} from "../../src/shared/contract/warehouse/AvailabilitySignal.js";

export class FakeAvailabilityFetcher implements AvailabilityFetcher {
  private availabilities: Map<string, AvailabilitySignal> = new Map();

  setAvailability(sku: string, level: AvailabilityLevel): void {
    this.availabilities.set(sku.toUpperCase(), createAvailabilitySignal(sku.toUpperCase(), level));
  }

  fetchAvailability(sku: string): AvailabilitySignal {
    const signal = this.availabilities.get(sku.toUpperCase());
    if (signal) {
      return signal;
    }
    return createAvailabilitySignal(sku.toUpperCase(), "HIGH");
  }

  clear(): void {
    this.availabilities.clear();
  }
}

export function createTestPricingUseCasesWithFakeAvailability(): {
  useCases: PricingUseCases;
  fakeAvailability: FakeAvailabilityFetcher;
  clearRepository: () => void;
} {
  const repository = new InMemoryPriceRepository();
  const fakeAvailability = new FakeAvailabilityFetcher();

  const useCases = createPricingUseCases(fakeAvailability, repository);

  return {
    useCases,
    fakeAvailability,
    clearRepository: () => repository.clear(),
  };
}

export function promotionDates(
  startDaysFromNow: number = -1,
  endDaysFromNow: number = 30,
): { validFrom: Date; validUntil: Date } {
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() + startDaysFromNow);

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + endDaysFromNow);

  return { validFrom, validUntil };
}

export function createBlackFridayPromotion(
  discountPercentage: number = 30,
  dates = promotionDates(),
): {
  name: string;
  type: PromotionType;
  discountPercentage: number;
  validFrom: Date;
  validUntil: Date;
  priority: number;
} {
  return {
    name: "Black Friday",
    type: "BLACK_FRIDAY",
    discountPercentage,
    validFrom: dates.validFrom,
    validUntil: dates.validUntil,
    priority: 10,
  };
}
