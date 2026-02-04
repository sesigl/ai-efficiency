import { type InventoryRepository, SKU } from "../domain/index.js";

export interface GetInventoryItemQuery {
  sku: string;
}

export interface InventoryItemDTO {
  sku: string;
  quantity: number;
  availableQuantity: number;
  reservations: ReservationDTO[];
}

export interface ReservationDTO {
  id: string;
  quantity: number;
  expiresAt: Date;
}

export class GetInventoryItem {
  constructor(private readonly repository: InventoryRepository) {}

  execute(query: GetInventoryItemQuery): InventoryItemDTO | undefined {
    const sku = SKU.create(query.sku);
    const item = this.repository.findBySku(sku);

    if (!item) {
      return undefined;
    }

    return {
      sku: item.getSku().toString(),
      quantity: item.getQuantity().toNumber(),
      availableQuantity: item.getAvailableQuantity().toNumber(),
      reservations: item.getReservations().map((r) => ({
        id: r.getId(),
        quantity: r.getQuantity().toNumber(),
        expiresAt: r.getExpiresAt(),
      })),
    };
  }
}
