import { describe, it, expect } from 'vitest';
import { InventoryItem } from '../../../../src/modules/warehouse/domain/InventoryItem.js';
import { SKU } from '../../../../src/modules/warehouse/domain/SKU.js';
import { Quantity } from '../../../../src/modules/warehouse/domain/Quantity.js';
import { futureDate } from '../../../fixtures/WarehouseFixtures.js';

describe('InventoryItem', () => {
  const sku = SKU.create('APPLE-001');

  describe('creation', () => {
    it('creates with zero quantity by default', () => {
      const item = InventoryItem.create(sku);

      expect(item.getQuantity().toNumber()).toBe(0);
      expect(item.getAvailableQuantity().toNumber()).toBe(0);
    });

    it('creates with initial quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(100));

      expect(item.getQuantity().toNumber()).toBe(100);
    });
  });

  describe('stock management', () => {
    it('adds stock to existing quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));

      item.addStock(Quantity.create(5));

      expect(item.getQuantity().toNumber()).toBe(15);
    });

    it('rejects adding zero quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));

      expect(() => item.addStock(Quantity.zero())).toThrow('Cannot add zero quantity');
    });

    it('removes stock from available quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));

      item.removeStock(Quantity.create(3));

      expect(item.getQuantity().toNumber()).toBe(7);
    });

    it('rejects removing more than available', () => {
      const item = InventoryItem.create(sku, Quantity.create(5));

      expect(() => item.removeStock(Quantity.create(10))).toThrow('Insufficient available stock');
    });
  });

  describe('reservations', () => {
    it('creates a reservation and reduces available quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));

      item.reserve('RES-001', Quantity.create(3), futureDate());

      expect(item.getQuantity().toNumber()).toBe(10);
      expect(item.getAvailableQuantity().toNumber()).toBe(7);
    });

    it('rejects reservation exceeding available quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(5));

      expect(() => item.reserve('RES-001', Quantity.create(10), futureDate()))
        .toThrow('Insufficient available stock for reservation');
    });

    it('releases a reservation and restores available quantity', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));
      item.reserve('RES-001', Quantity.create(3), futureDate());

      item.releaseReservation('RES-001');

      expect(item.getAvailableQuantity().toNumber()).toBe(10);
    });

    it('prevents removing stock that is reserved', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));
      item.reserve('RES-001', Quantity.create(8), futureDate());

      expect(() => item.removeStock(Quantity.create(5))).toThrow('Insufficient available stock');
    });
  });

  describe('availability signal', () => {
    it('returns HIGH when quantity is above threshold', () => {
      const item = InventoryItem.create(sku, Quantity.create(50));

      const signal = item.toAvailabilitySignal();

      expect(signal.level).toBe('HIGH');
      expect(signal.isLow).toBe(false);
      expect(signal.isOutOfStock).toBe(false);
    });

    it('returns LOW when quantity is below low threshold', () => {
      const item = InventoryItem.create(sku, Quantity.create(3));

      const signal = item.toAvailabilitySignal();

      expect(signal.level).toBe('LOW');
      expect(signal.isLow).toBe(true);
    });

    it('returns OUT_OF_STOCK when available quantity is zero', () => {
      const item = InventoryItem.create(sku, Quantity.zero());

      const signal = item.toAvailabilitySignal();

      expect(signal.level).toBe('OUT_OF_STOCK');
      expect(signal.isOutOfStock).toBe(true);
    });

    it('considers reservations when calculating availability level', () => {
      const item = InventoryItem.create(sku, Quantity.create(10));
      item.reserve('RES-001', Quantity.create(8), futureDate());

      const signal = item.toAvailabilitySignal();

      expect(signal.level).toBe('LOW');
    });
  });
});
