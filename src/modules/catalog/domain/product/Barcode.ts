export class Barcode {
  private constructor(private readonly value: string) {}

  static create(value: string): Barcode {
    if (!value || value.trim().length === 0) {
      throw new Error("Barcode cannot be empty");
    }
    return new Barcode(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Barcode): boolean {
    return this.value === other.value;
  }
}
