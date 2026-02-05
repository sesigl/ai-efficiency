export interface Promotion {
  name: string;
  type: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  priority: number;
}

export class PriceEntry {
  readonly sku: string;
  private _basePriceInCents: number;
  private _currency: string;
  private _promotions: Map<string, Promotion>;

  constructor(sku: string, basePriceInCents: number, currency: string = "USD") {
    this.sku = sku;
    this._basePriceInCents = basePriceInCents;
    this._currency = currency;
    this._promotions = new Map();
  }

  get basePriceInCents(): number {
    return this._basePriceInCents;
  }

  get currency(): string {
    return this._currency;
  }

  get promotions(): Promotion[] {
    return Array.from(this._promotions.values());
  }

  updateBasePrice(priceInCents: number): void {
    this._basePriceInCents = priceInCents;
  }

  addPromotion(promotion: Promotion): void {
    if (this._promotions.has(promotion.name)) {
      throw new Error("Promotion already exists");
    }
    this._promotions.set(promotion.name, promotion);
  }

  removePromotion(promotionName: string): void {
    this._promotions.delete(promotionName);
  }
}
