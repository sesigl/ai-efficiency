import { SKU } from './SKU.js';
import { Quantity } from './Quantity.js';
import { Reservation } from './Reservation.js';
import {
  AvailabilityLevel,
  createAvailabilitySignal,
  AvailabilitySignal,
} from '../../../shared/contract/warehouse/index.js';

const MEDIUM_STOCK_THRESHOLD = 10;
const LOW_STOCK_THRESHOLD = 5;

export class InventoryItem {
  private constructor(
    private readonly sku: SKU,
    private quantity: Quantity,
    private reservations: Reservation[]
  ) {}

  static create(sku: SKU, initialQuantity: Quantity = Quantity.zero()): InventoryItem {
    return new InventoryItem(sku, initialQuantity, []);
  }

  getSku(): SKU {
    return this.sku;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getReservations(): readonly Reservation[] {
    return [...this.reservations];
  }

  getAvailableQuantity(): Quantity {
    const totalReserved = this.reservations.reduce(
      (sum, reservation) => sum.add(reservation.getQuantity()),
      Quantity.zero()
    );
    return this.quantity.subtract(totalReserved);
  }

  addStock(quantity: Quantity): void {
    if (quantity.isZero()) {
      throw new Error('Cannot add zero quantity');
    }
    this.quantity = this.quantity.add(quantity);
  }

  removeStock(quantity: Quantity): void {
    if (quantity.isZero()) {
      throw new Error('Cannot remove zero quantity');
    }
    const available = this.getAvailableQuantity();
    if (quantity.isGreaterThan(available)) {
      throw new Error('Insufficient available stock');
    }
    this.quantity = this.quantity.subtract(quantity);
  }

  reserve(reservationId: string, quantity: Quantity, expiresAt: Date): Reservation {
    const existingReservation = this.reservations.find(r => r.getId() === reservationId);
    if (existingReservation) {
      throw new Error('Reservation ID already exists');
    }

    const available = this.getAvailableQuantity();
    if (quantity.isGreaterThan(available)) {
      throw new Error('Insufficient available stock for reservation');
    }

    const reservation = Reservation.create(reservationId, quantity, expiresAt);
    this.reservations.push(reservation);
    return reservation;
  }

  releaseReservation(reservationId: string): void {
    const index = this.reservations.findIndex(r => r.getId() === reservationId);
    if (index === -1) {
      throw new Error('Reservation not found');
    }
    this.reservations.splice(index, 1);
  }

  removeExpiredReservations(now: Date = new Date()): number {
    const initialCount = this.reservations.length;
    this.reservations = this.reservations.filter(r => !r.isExpired(now));
    return initialCount - this.reservations.length;
  }

  getAvailabilityLevel(): AvailabilityLevel {
    const available = this.getAvailableQuantity().toNumber();

    if (available === 0) {
      return 'OUT_OF_STOCK';
    }
    if (available < LOW_STOCK_THRESHOLD) {
      return 'LOW';
    }
    if (available < MEDIUM_STOCK_THRESHOLD) {
      return 'MEDIUM';
    }
    return 'HIGH';
  }

  toAvailabilitySignal(): AvailabilitySignal {
    return createAvailabilitySignal(this.sku.toString(), this.getAvailabilityLevel());
  }
}
