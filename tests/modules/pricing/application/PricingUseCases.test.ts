import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestPricingContainerWithFakeAvailability,
  createBlackFridayPromotion,
} from '../../../fixtures/PricingFixtures.js';

describe('Pricing Use Cases', () => {
  const createContainer = () => createTestPricingContainerWithFakeAvailability();

  describe('SetBasePrice', () => {
    it('creates price entry for new SKU', () => {
      const { container } = createContainer();

      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 999 });

      const entry = container.getPriceEntry.execute({ sku: 'APPLE-001' });
      expect(entry?.basePriceInCents).toBe(999);
    });

    it('updates base price for existing SKU', () => {
      const { container } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 999 });

      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 1299 });

      const entry = container.getPriceEntry.execute({ sku: 'APPLE-001' });
      expect(entry?.basePriceInCents).toBe(1299);
    });
  });

  describe('AddPromotion', () => {
    it('adds promotion to existing price entry', () => {
      const { container } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 999 });
      const promo = createBlackFridayPromotion();

      container.addPromotion.execute({ sku: 'APPLE-001', ...promo });

      const entry = container.getPriceEntry.execute({ sku: 'APPLE-001' });
      expect(entry?.promotions).toHaveLength(1);
      expect(entry?.promotions[0]?.name).toBe('Black Friday');
    });

    it('rejects promotion for non-existent SKU', () => {
      const { container } = createContainer();
      const promo = createBlackFridayPromotion();

      expect(() => container.addPromotion.execute({ sku: 'UNKNOWN', ...promo }))
        .toThrow('Price entry not found');
    });
  });

  describe('RemovePromotion', () => {
    it('removes promotion from price entry', () => {
      const { container } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 999 });
      container.addPromotion.execute({ sku: 'APPLE-001', ...createBlackFridayPromotion() });

      container.removePromotion.execute({ sku: 'APPLE-001', promotionName: 'Black Friday' });

      const entry = container.getPriceEntry.execute({ sku: 'APPLE-001' });
      expect(entry?.promotions).toHaveLength(0);
    });
  });

  describe('CalculatePrice', () => {
    it('returns base price when no promotions', () => {
      const { container, fakeAvailability } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 1000 });
      fakeAvailability.setAvailability('APPLE-001', 'HIGH');

      const result = container.calculatePrice.execute({ sku: 'APPLE-001' });

      expect(result.finalPrice.getCents()).toBe(1000);
    });

    it('applies full discount with high availability', () => {
      const { container, fakeAvailability } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 1000 });
      container.addPromotion.execute({ sku: 'APPLE-001', ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability('APPLE-001', 'HIGH');

      const result = container.calculatePrice.execute({ sku: 'APPLE-001' });

      expect(result.finalPrice.getCents()).toBe(700);
    });

    it('reduces discount with low availability', () => {
      const { container, fakeAvailability } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 1000 });
      container.addPromotion.execute({ sku: 'APPLE-001', ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability('APPLE-001', 'LOW');

      const result = container.calculatePrice.execute({ sku: 'APPLE-001' });

      expect(result.finalPrice.getCents()).toBe(850);
      expect(result.appliedDiscounts[0]?.originalPercentage).toBe(30);
      expect(result.appliedDiscounts[0]?.appliedPercentage).toBe(15);
    });

    it('applies no discount when out of stock', () => {
      const { container, fakeAvailability } = createContainer();
      container.setBasePrice.execute({ sku: 'APPLE-001', priceInCents: 1000 });
      container.addPromotion.execute({ sku: 'APPLE-001', ...createBlackFridayPromotion(30) });
      fakeAvailability.setAvailability('APPLE-001', 'OUT_OF_STOCK');

      const result = container.calculatePrice.execute({ sku: 'APPLE-001' });

      expect(result.finalPrice.getCents()).toBe(1000);
      expect(result.appliedDiscounts[0]?.appliedPercentage).toBe(0);
    });
  });
});
