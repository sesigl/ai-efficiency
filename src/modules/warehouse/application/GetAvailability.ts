import { InventoryRepository, SKU } from '../domain/index.js';
import { AvailabilitySignal, createAvailabilitySignal } from '../../../shared/contract/warehouse/index.js';

export interface GetAvailabilityQuery {
  sku: string;
}

export class GetAvailability {
  constructor(private readonly repository: InventoryRepository) {}

  execute(query: GetAvailabilityQuery): AvailabilitySignal {
    const sku = SKU.create(query.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      return createAvailabilitySignal(query.sku, 'OUT_OF_STOCK');
    }

    return item.toAvailabilitySignal();
  }
}
