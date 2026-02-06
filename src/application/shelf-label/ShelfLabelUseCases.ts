export type AvailabilityBadge = "In Stock" | "Low Stock" | "Out of Stock";

export interface ShelfLabelPriceInfo {
  basePriceInCents: number;
  finalPriceInCents: number;
  savingsPercentage: number;
  hasActiveDiscount: boolean;
}

export interface ShelfLabelAvailabilityInfo {
  badge: AvailabilityBadge;
}

export interface ShelfLabelPriceProvider {
  getShelfLabelPriceInfo(sku: string): ShelfLabelPriceInfo | undefined;
}

export interface ShelfLabelAvailabilityProvider {
  getShelfLabelAvailabilityInfo(sku: string): ShelfLabelAvailabilityInfo;
}

export interface ShelfLabelDTO {
  sku: string;
  finalPriceInCents: number;
  basePriceInCents: number | null;
  savingsPercentage: number;
  availabilityBadge: AvailabilityBadge;
}

export interface GenerateShelfLabelQuery {
  sku: string;
}

export class ShelfLabelUseCases {
  constructor(
    private readonly priceProvider: ShelfLabelPriceProvider,
    private readonly availabilityProvider: ShelfLabelAvailabilityProvider,
  ) {}

  generateShelfLabel(query: GenerateShelfLabelQuery): ShelfLabelDTO | undefined {
    const priceInfo = this.priceProvider.getShelfLabelPriceInfo(query.sku);

    if (!priceInfo) {
      return undefined;
    }

    const availabilityInfo = this.availabilityProvider.getShelfLabelAvailabilityInfo(query.sku);

    return {
      sku: query.sku,
      finalPriceInCents: priceInfo.finalPriceInCents,
      basePriceInCents: priceInfo.hasActiveDiscount ? priceInfo.basePriceInCents : null,
      savingsPercentage: priceInfo.savingsPercentage,
      availabilityBadge: availabilityInfo.badge,
    };
  }
}
