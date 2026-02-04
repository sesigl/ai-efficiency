import { type PriceRepository, SKU, type PromotionType } from "../domain/index.js";

export class GetPriceEntryQuery {
  constructor(public readonly sku: string) {}
}

export class PriceEntryDTO {
  constructor(
    public readonly sku: string,
    public readonly basePriceInCents: number,
    public readonly currency: string,
    public readonly promotions: PromotionDTO[],
  ) {}
}

export class PromotionDTO {
  constructor(
    public readonly name: string,
    public readonly type: PromotionType,
    public readonly discountPercentage: number,
    public readonly validFrom: Date,
    public readonly validUntil: Date,
    public readonly priority: number,
  ) {}
}

export class GetPriceEntry {
  constructor(private readonly repository: PriceRepository) {}

  execute(query: GetPriceEntryQuery): PriceEntryDTO | undefined {
    const sku = SKU.create(query.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      return undefined;
    }

    return new PriceEntryDTO(
      entry.getSku().toString(),
      entry.getBasePrice().getCents(),
      entry.getBasePrice().getCurrency(),
      entry
        .getPromotions()
        .map(
          (p) =>
            new PromotionDTO(
              p.getName(),
              p.getType(),
              p.getDiscountPercentage(),
              p.getValidFrom(),
              p.getValidUntil(),
              p.getPriority(),
            ),
        ),
    );
  }
}
