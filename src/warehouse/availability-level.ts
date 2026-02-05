export enum AvailabilityLevel {
  HIGH = "HIGH",
  LOW = "LOW",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export interface AvailabilityStatus {
  sku: string;
  level: AvailabilityLevel;
  isLow: boolean;
  isOutOfStock: boolean;
}

export function determineAvailabilityLevel(availableQuantity: number): AvailabilityLevel {
  if (availableQuantity === 0) {
    return AvailabilityLevel.OUT_OF_STOCK;
  }
  if (availableQuantity <= 5) {
    return AvailabilityLevel.LOW;
  }
  return AvailabilityLevel.HIGH;
}
