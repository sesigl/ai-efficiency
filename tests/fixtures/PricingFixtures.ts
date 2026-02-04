import { createPricingContainer, PricingContainer, PromotionType } from '../../src/modules/pricing/index.js';
import { InMemoryPriceRepository } from '../../src/modules/pricing/infrastructure/InMemoryPriceRepository.js';
import { AvailabilityProvider } from '../../src/modules/pricing/domain/AvailabilityProvider.js';
import { AvailabilitySignal, createAvailabilitySignal, AvailabilityLevel } from '../../src/shared/contract/warehouse/index.js';
import { GetAvailability } from '../../src/modules/warehouse/application/index.js';

export class FakeAvailabilityProvider implements AvailabilityProvider {
  private availabilities: Map<string, AvailabilitySignal> = new Map();

  setAvailability(sku: string, level: AvailabilityLevel): void {
    this.availabilities.set(sku.toUpperCase(), createAvailabilitySignal(sku.toUpperCase(), level));
  }

  getAvailability(sku: string): AvailabilitySignal {
    const signal = this.availabilities.get(sku.toUpperCase());
    if (signal) {
      return signal;
    }
    return createAvailabilitySignal(sku.toUpperCase(), 'HIGH');
  }

  clear(): void {
    this.availabilities.clear();
  }
}

export function createTestPricingContainerWithFakeAvailability(): {
  container: PricingContainer;
  fakeAvailability: FakeAvailabilityProvider;
  clearRepository: () => void;
} {
  const repository = new InMemoryPriceRepository();
  const fakeAvailability = new FakeAvailabilityProvider();

  const fakeGetAvailability = {
    execute: (query: { sku: string }) => fakeAvailability.getAvailability(query.sku),
  } as GetAvailability;

  const container = createPricingContainer(fakeGetAvailability, repository);

  return {
    container,
    fakeAvailability,
    clearRepository: () => repository.clear(),
  };
}

export function promotionDates(startDaysFromNow: number = -1, endDaysFromNow: number = 30): { validFrom: Date; validUntil: Date } {
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() + startDaysFromNow);

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + endDaysFromNow);

  return { validFrom, validUntil };
}

export function createBlackFridayPromotion(
  discountPercentage: number = 30,
  dates = promotionDates()
): {
  name: string;
  type: PromotionType;
  discountPercentage: number;
  validFrom: Date;
  validUntil: Date;
  priority: number;
} {
  return {
    name: 'Black Friday',
    type: 'BLACK_FRIDAY',
    discountPercentage,
    validFrom: dates.validFrom,
    validUntil: dates.validUntil,
    priority: 10,
  };
}
