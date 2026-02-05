export interface Reservation {
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

export class InventoryItem {
  private reservations: Reservation[] = [];

  constructor(
    public readonly sku: string,
    private quantity: number,
  ) {}

  getQuantity(): number {
    return this.quantity;
  }

  getReservations(): Reservation[] {
    return [...this.reservations];
  }

  getAvailableQuantity(): number {
    const reservedQuantity = this.reservations.reduce(
      (sum, reservation) => sum + reservation.quantity,
      0,
    );
    return this.quantity - reservedQuantity;
  }

  addStock(amount: number): void {
    if (amount === 0) {
      throw new Error("Cannot add zero quantity");
    }
    this.quantity += amount;
  }

  removeStock(amount: number): void {
    const availableQuantity = this.getAvailableQuantity();
    if (amount > availableQuantity) {
      throw new Error("Insufficient available stock");
    }
    this.quantity -= amount;
  }

  reserve(reservationId: string, quantity: number, expiresAt: string): void {
    if (quantity > this.getAvailableQuantity()) {
      throw new Error("Insufficient available stock for reservation");
    }
    this.reservations.push({ reservationId, quantity, expiresAt });
  }

  releaseReservation(reservationId: string): void {
    this.reservations = this.reservations.filter((r) => r.reservationId !== reservationId);
  }
}
