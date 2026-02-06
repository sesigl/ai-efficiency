export class BulkTier {
  private constructor(
    private readonly minQuantity: number,
    private readonly maxQuantity: number | null,
    private readonly discountPercentage: number,
  ) {}

  static create(
    minQuantity: number,
    maxQuantity: number | null,
    discountPercentage: number,
  ): BulkTier {
    if (minQuantity < 1) {
      throw new Error("Minimum quantity must be at least 1");
    }
    if (maxQuantity !== null && maxQuantity < minQuantity) {
      throw new Error("Maximum quantity must be greater than or equal to minimum quantity");
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    return new BulkTier(minQuantity, maxQuantity, discountPercentage);
  }

  getMinQuantity(): number {
    return this.minQuantity;
  }

  getMaxQuantity(): number | null {
    return this.maxQuantity;
  }

  getDiscountPercentage(): number {
    return this.discountPercentage;
  }

  appliesTo(quantity: number): boolean {
    if (quantity < this.minQuantity) {
      return false;
    }
    if (this.maxQuantity === null) {
      return true;
    }
    return quantity <= this.maxQuantity;
  }
}
