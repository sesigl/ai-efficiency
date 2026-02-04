import { PriceRepository, SKU, Promotion, PromotionType } from '../domain/index.js';

export class AddPromotionCommand {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly type: PromotionType,
    public readonly discountPercentage: number,
    public readonly validFrom: Date,
    public readonly validUntil: Date,
    public readonly priority: number = 0
  ) {}
}

export class AddPromotion {
  constructor(private readonly repository: PriceRepository) {}

  execute(command: AddPromotionCommand): void {
    const sku = SKU.create(command.sku);
    const entry = this.repository.findBySku(sku);

    if (!entry) {
      throw new Error(`Price entry not found: ${command.sku}`);
    }

    const promotion = Promotion.create(
      command.name,
      command.type,
      command.discountPercentage,
      command.validFrom,
      command.validUntil,
      command.priority
    );

    entry.addPromotion(promotion);
    this.repository.save(entry);
  }
}
