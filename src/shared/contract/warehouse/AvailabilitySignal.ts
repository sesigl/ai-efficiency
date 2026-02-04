export type AvailabilityLevel = "HIGH" | "MEDIUM" | "LOW" | "OUT_OF_STOCK";

export interface AvailabilitySignal {
  readonly sku: string;
  readonly level: AvailabilityLevel;
  readonly isLow: boolean;
  readonly isOutOfStock: boolean;
}

export function createAvailabilitySignal(
  sku: string,
  level: AvailabilityLevel,
): AvailabilitySignal {
  return {
    sku,
    level,
    isLow: level === "LOW",
    isOutOfStock: level === "OUT_OF_STOCK",
  };
}
