import {
  type PriceRepository,
  SKU,
  type AvailabilityProvider,
  type CalculatedPrice,
} from "../domain/index.js";

export class CalculatePriceQuery {
  constructor(
    public readonly sku: string,
    public readonly at: Date = new Date(),
  ) {}
}

export class CalculatePrice {
  constructor(
    private readonly repository: PriceRepository,
    private readonly availabilityProvider: AvailabilityProvider,
  ) {}

  execute(query: CalculatePriceQuery): CalculatedPrice {
    const sku = SKU.create(query.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${query.sku}`);
    }

    const availability = this.availabilityProvider.getAvailability(query.sku);
    return entry.calculatePrice(availability, query.at);
  }
}
