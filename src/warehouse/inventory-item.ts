export interface Reservation {
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

export class InventoryItem {
  readonly sku: string;
  private _quantity: number;
  private _reservations: Map<string, Reservation>;

  constructor(sku: string, initialQuantity: number = 0) {
    this.sku = sku;
    this._quantity = initialQuantity;
    this._reservations = new Map();
  }

  get quantity(): number {
    return this._quantity;
  }

  get availableQuantity(): number {
    const reserved = Array.from(this._reservations.values()).reduce(
      (sum, r) => sum + r.quantity,
      0,
    );
    return this._quantity - reserved;
  }

  get reservations(): Reservation[] {
    return Array.from(this._reservations.values());
  }

  addStock(quantity: number): void {
    this._quantity += quantity;
  }

  removeStock(quantity: number): void {
    if (quantity > this.availableQuantity) {
      throw new Error("Insufficient available stock");
    }
    this._quantity -= quantity;
  }

  createReservation(reservationId: string, quantity: number, expiresAt: string): void {
    if (quantity > this.availableQuantity) {
      throw new Error("Insufficient available stock for reservation");
    }
    this._reservations.set(reservationId, { reservationId, quantity, expiresAt });
  }

  releaseReservation(reservationId: string): void {
    this._reservations.delete(reservationId);
  }
}
