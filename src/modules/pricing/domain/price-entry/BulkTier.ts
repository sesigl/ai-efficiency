export class BulkTier {
  private constructor(
    private readonly minQuantity: number,
    private readonly discountPercentage: number,
  ) {}

  static create(minQuantity: number, discountPercentage: number): BulkTier {
    if (minQuantity < 1) {
      throw new Error("Minimum quantity must be at least 1");
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    return new BulkTier(minQuantity, discountPercentage);
  }

  getMinQuantity(): number {
    return this.minQuantity;
  }

  getDiscountPercentage(): number {
    return this.discountPercentage;
  }

  appliesTo(quantity: number): boolean {
    return quantity >= this.minQuantity;
  }
}
