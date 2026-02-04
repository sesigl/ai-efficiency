import type { AvailabilityProvider } from "../../domain/AvailabilityProvider.js";
import type { CalculatedPrice } from "../../domain/CalculatedPrice.js";
import { Money } from "../../domain/Money.js";
import type { PriceEntryRepository } from "../../domain/PriceEntryRepository.js";
import { PriceEntry } from "../../domain/PriceEntry.js";
import type { PromotionType } from "../../domain/Promotion.js";
import { SKU } from "../../domain/SKU.js";

export interface SetBasePriceCommand {
  sku: string;
  priceInCents: number;
  currency?: string;
}

export interface CalculatePriceQuery {
  sku: string;
  at?: Date;
}

export interface GetPriceEntryQuery {
  sku: string;
}

export class PriceEntryDTO {
  constructor(
    public readonly sku: string,
    public readonly basePriceInCents: number,
    public readonly currency: string,
    public readonly promotions: PromotionDTO[],
  ) {}
}

class PromotionDTO {
  constructor(
    public readonly name: string,
    public readonly type: PromotionType,
    public readonly discountPercentage: number,
    public readonly validFrom: Date,
    public readonly validUntil: Date,
    public readonly priority: number,
  ) {}
}

export class PriceEntryUseCases {
  constructor(
    private readonly repository: PriceEntryRepository,
    private readonly availabilityProvider: AvailabilityProvider,
  ) {}

  setBasePrice(command: SetBasePriceCommand): void {
    const sku = SKU.create(command.sku);
    const price = Money.fromCents(command.priceInCents, command.currency ?? "USD");

    let entry = this.repository.findBySku(sku);

    if (!entry) {
      entry = PriceEntry.create(sku, price);
    } else {
      entry.setBasePrice(price);
    }

    this.repository.save(entry);
  }

  calculatePrice(query: CalculatePriceQuery): CalculatedPrice {
    const sku = SKU.create(query.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${query.sku}`);
    }

    const availability = this.availabilityProvider.getAvailability(query.sku);
    return entry.calculatePrice(availability, query.at ?? new Date());
  }

  getPriceEntry(query: GetPriceEntryQuery): PriceEntryDTO | undefined {
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
          (promotion) =>
            new PromotionDTO(
              promotion.getName(),
              promotion.getType(),
              promotion.getDiscountPercentage(),
              promotion.getValidFrom(),
              promotion.getValidUntil(),
              promotion.getPriority(),
            ),
        ),
    );
  }
}
