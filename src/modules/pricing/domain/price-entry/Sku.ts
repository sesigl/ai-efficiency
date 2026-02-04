export class SKU {
  private constructor(private readonly value: string) {}

  static create(value: string): SKU {
    if (!value || value.trim().length === 0) {
      throw new Error("SKU cannot be empty");
    }
    if (!/^[A-Z0-9-]+$/i.test(value)) {
      throw new Error("SKU must contain only alphanumeric characters and hyphens");
    }
    return new SKU(value.toUpperCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }
}
