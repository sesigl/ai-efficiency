export class Money {
  private constructor(
    private readonly amountInCents: number,
    private readonly currency: string
  ) {}

  static fromCents(amountInCents: number, currency: string = 'USD'): Money {
    if (!Number.isInteger(amountInCents)) {
      throw new Error('Amount in cents must be an integer');
    }
    if (amountInCents < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money(amountInCents, currency.toUpperCase());
  }

  static fromDollars(amount: number, currency: string = 'USD'): Money {
    return Money.fromCents(Math.round(amount * 100), currency);
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency.toUpperCase());
  }

  getCents(): number {
    return this.amountInCents;
  }

  getCurrency(): string {
    return this.currency;
  }

  toDollars(): number {
    return this.amountInCents / 100;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amountInCents - other.amountInCents;
    if (result < 0) {
      throw new Error('Cannot subtract: would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  multiplyByPercentage(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    const result = Math.round(this.amountInCents * (percentage / 100));
    return new Money(result, this.currency);
  }

  applyDiscount(discountPercentage: number): Money {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    const discountAmount = Math.round(this.amountInCents * (discountPercentage / 100));
    return new Money(this.amountInCents - discountAmount, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amountInCents > other.amountInCents;
  }

  isZero(): boolean {
    return this.amountInCents === 0;
  }

  equals(other: Money): boolean {
    return this.amountInCents === other.amountInCents && this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
