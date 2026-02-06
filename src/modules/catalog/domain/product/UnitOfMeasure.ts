export type UnitOfMeasureType = "kg" | "piece" | "liter" | "pack";

const VALID_UNITS: UnitOfMeasureType[] = ["kg", "piece", "liter", "pack"];

export class UnitOfMeasure {
  private constructor(private readonly value: UnitOfMeasureType) {}

  static create(value: string): UnitOfMeasure {
    if (!VALID_UNITS.includes(value as UnitOfMeasureType)) {
      throw new Error(
        `Invalid unit of measure: ${value}. Must be one of: ${VALID_UNITS.join(", ")}`,
      );
    }
    return new UnitOfMeasure(value as UnitOfMeasureType);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UnitOfMeasure): boolean {
    return this.value === other.value;
  }
}
