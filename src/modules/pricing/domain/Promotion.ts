export type PromotionType = "BLACK_FRIDAY" | "CLEARANCE" | "SEASONAL" | "BULK_DISCOUNT";

export class Promotion {
  private constructor(
    private readonly name: string,
    private readonly type: PromotionType,
    private readonly discountPercentage: number,
    private readonly validFrom: Date,
    private readonly validUntil: Date,
    private readonly priority: number,
  ) {}

  static create(
    name: string,
    type: PromotionType,
    discountPercentage: number,
    validFrom: Date,
    validUntil: Date,
    priority: number = 0,
  ): Promotion {
    if (!name || name.trim().length === 0) {
      throw new Error("Promotion name cannot be empty");
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    if (validFrom >= validUntil) {
      throw new Error("Valid from date must be before valid until date");
    }
    return new Promotion(name, type, discountPercentage, validFrom, validUntil, priority);
  }

  getName(): string {
    return this.name;
  }

  getType(): PromotionType {
    return this.type;
  }

  getDiscountPercentage(): number {
    return this.discountPercentage;
  }

  getValidFrom(): Date {
    return this.validFrom;
  }

  getValidUntil(): Date {
    return this.validUntil;
  }

  getPriority(): number {
    return this.priority;
  }

  isActiveAt(date: Date): boolean {
    return date >= this.validFrom && date < this.validUntil;
  }

  equals(other: Promotion): boolean {
    return this.name === other.name && this.type === other.type;
  }
}
