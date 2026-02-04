import { AvailabilityProvider } from '../domain/index.js';
import { AvailabilitySignal } from '../../../shared/contract/warehouse/index.js';
import { GetAvailability } from '../../warehouse/application/index.js';

export class WarehouseAvailabilityAdapter implements AvailabilityProvider {
  constructor(private readonly warehouseGetAvailability: GetAvailability) {}

  getAvailability(sku: string): AvailabilitySignal {
    return this.warehouseGetAvailability.execute({ sku });
  }
}
