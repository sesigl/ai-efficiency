import type { AvailabilityProvider } from "../../domain/price-entry/AvailabilityProvider.js";
import type { CalculatedPrice } from "../../domain/price-entry/CalculatedPrice.js";
import { Money } from "../../domain/price-entry/Money.js";
import type { PriceEntryRepository } from "../../domain/price-entry/PriceEntryRepository.js";
import { PriceEntry } from "../../domain/price-entry/PriceEntry.js";
import type { PromotionType } from "../../domain/price-entry/Promotion.js";
import { SKU } from "../../domain/price-entry/Sku.js";
import { ScheduledPrice } from "../../domain/price-entry/ScheduledPrice.js";
import { BulkTier } from "../../domain/price-entry/BulkTier.js";

export interface SetBasePriceCommand {
  sku: string;
  priceInCents: number;
  currency?: string;
}

export interface ScheduleBasePriceCommand {
  sku: string;
  priceInCents: number;
  effectiveDate: Date;
  currency?: string;
}

export interface SetBulkTiersCommand {
  sku: string;
  tiers: { minQuantity: number; discountPercentage: number }[];
}

export interface CalculatePriceQuery {
  sku: string;
  at?: Date;
  quantity?: number;
}

export interface GetPriceEntryQuery {
  sku: string;
}

export interface GetSavingsSummaryQuery {
  sku: string;
  quantity?: number;
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

export interface SavingsSummaryDTO {
  sku: string;
  basePriceInCents: number;
  finalPriceInCents: number;
  currency: string;
  totalSavingsInCents: number;
  totalSavingsPercentage: number;
  discounts: DiscountDetailDTO[];
}

export interface DiscountDetailDTO {
  promotionName: string;
  amountSavedInCents: number;
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

  scheduleBasePrice(command: ScheduleBasePriceCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    const price = Money.fromCents(
      command.priceInCents,
      command.currency ?? entry.getBasePrice().getCurrency(),
    );
    const scheduledPrice = ScheduledPrice.create(price, command.effectiveDate);
    entry.scheduleBasePrice(scheduledPrice);
    this.repository.save(entry);
  }

  setBulkTiers(command: SetBulkTiersCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    const tiers = command.tiers.map((t) => BulkTier.create(t.minQuantity, t.discountPercentage));
    entry.setBulkTiers(tiers);
    this.repository.save(entry);
  }

  calculatePrice(query: CalculatePriceQuery): CalculatedPrice {
    const sku = SKU.create(query.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${query.sku}`);
    }

    const availability = this.availabilityProvider.getAvailability(query.sku);
    return entry.calculatePrice(availability, query.at ?? new Date(), query.quantity);
  }

  calculateSavingsSummary(query: GetSavingsSummaryQuery): SavingsSummaryDTO {
    const sku = SKU.create(query.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${query.sku}`);
    }

    const availability = this.availabilityProvider.getAvailability(query.sku);
    const calculated = entry.calculatePrice(availability, new Date(), query.quantity);

    const baseCents = calculated.basePrice.getCents();
    const finalCents = calculated.finalPrice.getCents();
    const totalSavings = baseCents - finalCents;
    const totalSavingsPercentage = baseCents > 0 ? Math.round((totalSavings / baseCents) * 100) : 0;

    let runningPrice = baseCents;
    const discounts: DiscountDetailDTO[] = calculated.appliedDiscounts
      .filter((d) => d.appliedPercentage > 0)
      .map((d) => {
        const savedCents = Math.round(runningPrice * (d.appliedPercentage / 100));
        runningPrice = runningPrice - savedCents;
        return {
          promotionName: d.promotionName,
          amountSavedInCents: savedCents,
        };
      });

    return {
      sku: calculated.sku,
      basePriceInCents: baseCents,
      finalPriceInCents: finalCents,
      currency: calculated.basePrice.getCurrency(),
      totalSavingsInCents: totalSavings,
      totalSavingsPercentage,
      discounts,
    };
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
