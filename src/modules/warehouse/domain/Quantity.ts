export class Quantity {
  private constructor(private readonly value: number) {}

  static create(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer');
    }
    if (value < 0) {
      throw new Error('Quantity cannot be negative');
    }
    return new Quantity(value);
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  toNumber(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error('Cannot subtract: would result in negative quantity');
    }
    return new Quantity(result);
  }

  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
