export class SKU {
  private constructor(private readonly value: string) {}

  static create(value: string): SKU {
    if (!value || value.trim().length === 0) {
      throw new Error("SKU cannot be empty");
    }
    return new SKU(value.trim().toUpperCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }
}
