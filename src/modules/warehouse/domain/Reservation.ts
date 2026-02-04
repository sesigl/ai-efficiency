import { Quantity } from './Quantity.js';

export class Reservation {
  private constructor(
    private readonly id: string,
    private readonly quantity: Quantity,
    private readonly expiresAt: Date
  ) {}

  static create(id: string, quantity: Quantity, expiresAt: Date): Reservation {
    if (!id || id.trim().length === 0) {
      throw new Error('Reservation ID cannot be empty');
    }
    if (quantity.isZero()) {
      throw new Error('Reservation quantity must be greater than zero');
    }
    if (expiresAt <= new Date()) {
      throw new Error('Reservation expiration must be in the future');
    }
    return new Reservation(id, quantity, expiresAt);
  }

  getId(): string {
    return this.id;
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.expiresAt;
  }

  equals(other: Reservation): boolean {
    return this.id === other.id;
  }
}
