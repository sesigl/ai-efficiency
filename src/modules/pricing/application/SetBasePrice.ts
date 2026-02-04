import type { PriceRepository } from "../domain/PriceRepository.js";
import { SKU } from "../domain/SKU.js";
import { Money } from "../domain/Money.js";
import { PriceEntry } from "../domain/PriceEntry.js";

export class SetBasePriceCommand {
  constructor(
    public readonly sku: string,
    public readonly priceInCents: number,
    public readonly currency: string = "USD",
  ) {}
}

export class SetBasePrice {
  constructor(private readonly repository: PriceRepository) {}

  execute(command: SetBasePriceCommand): void {
    const sku = SKU.create(command.sku);
    const price = Money.fromCents(command.priceInCents, command.currency);

    let entry = this.repository.findBySku(sku);

    if (!entry) {
      entry = PriceEntry.create(sku, price);
    } else {
      entry.setBasePrice(price);
    }

    this.repository.save(entry);
  }
}
