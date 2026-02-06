import type { Quantity } from "./Quantity.js";
import type { ShrinkageReason } from "./ShrinkageReason.js";

export class ShrinkageRecord {
  private constructor(
    private readonly quantity: Quantity,
    private readonly reason: ShrinkageReason,
    private readonly recordedAt: Date,
  ) {}

  static create(quantity: Quantity, reason: ShrinkageReason): ShrinkageRecord {
    return new ShrinkageRecord(quantity, reason, new Date());
  }

  getQuantity(): Quantity {
    return this.quantity;
  }

  getReason(): ShrinkageReason {
    return this.reason;
  }

  getRecordedAt(): Date {
    return this.recordedAt;
  }
}
