export interface Reservation {
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

export type ShrinkageReason = "damaged" | "expired" | "theft";

export interface ShrinkageRecord {
  quantity: number;
  reason: ShrinkageReason;
  recordedAt: string;
}

export class InventoryItem {
  private reservations: Reservation[] = [];
  private shrinkageRecords: ShrinkageRecord[] = [];
  private reorderThreshold: number | undefined;

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

  setQuantity(newQuantity: number): number {
    const previousQuantity = this.quantity;
    this.quantity = newQuantity;
    return newQuantity - previousQuantity;
  }

  setReorderThreshold(threshold: number): void {
    this.reorderThreshold = threshold;
  }

  getReorderThreshold(): number | undefined {
    return this.reorderThreshold;
  }

  needsReorder(): boolean {
    if (this.reorderThreshold === undefined) {
      return false;
    }
    return this.getAvailableQuantity() <= this.reorderThreshold;
  }

  recordShrinkage(quantity: number, reason: ShrinkageReason): void {
    const availableQuantity = this.getAvailableQuantity();
    if (quantity > availableQuantity) {
      throw new Error("Insufficient available stock for shrinkage");
    }
    this.quantity -= quantity;
    this.shrinkageRecords.push({
      quantity,
      reason,
      recordedAt: new Date().toISOString(),
    });
  }

  getShrinkageRecords(): ShrinkageRecord[] {
    return [...this.shrinkageRecords];
  }
}
