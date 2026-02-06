import type { InventoryRepository } from "./inventory-repository.js";

export interface ReserveStockRequest {
  sku: string;
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

export interface ReserveStockResponse {
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

export class ReserveStockUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  execute(request: ReserveStockRequest): ReserveStockResponse {
    const item = this.inventoryRepository.findBySku(request.sku);
    if (!item) {
      throw new Error("Inventory item not found");
    }

    item.reserve(request.reservationId, request.quantity, request.expiresAt);

    return {
      reservationId: request.reservationId,
      quantity: request.quantity,
      expiresAt: request.expiresAt,
    };
  }
}
