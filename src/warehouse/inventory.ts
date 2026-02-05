import type { Reservation } from "./reservation.js";

export class Inventory {
  constructor(
    public sku: string,
    public quantity: number,
    public reservations: Reservation[] = [],
  ) {}

  get availableQuantity(): number {
    const reservedQuantity = this.reservations.reduce((sum, r) => sum + r.quantity, 0);
    return this.quantity - reservedQuantity;
  }

  addStock(quantity: number): void {
    this.quantity += quantity;
  }

  removeStock(quantity: number): void {
    if (quantity > this.availableQuantity) {
      throw new Error("Insufficient available stock");
    }
    this.quantity -= quantity;
  }

  reserveStock(reservation: Reservation): void {
    if (reservation.quantity > this.availableQuantity) {
      throw new Error("Insufficient available stock for reservation");
    }
    this.reservations.push(reservation);
  }

  releaseReservation(reservationId: string): void {
    this.reservations = this.reservations.filter((r) => r.reservationId !== reservationId);
  }
}
