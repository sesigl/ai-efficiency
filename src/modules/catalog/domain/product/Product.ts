import type { SKU } from "./Sku.js";
import type { Category } from "./Category.js";
import type { UnitOfMeasure } from "./UnitOfMeasure.js";
import type { Barcode } from "./Barcode.js";

export class Product {
  private constructor(
    private readonly sku: SKU,
    private readonly name: string,
    private readonly description: string,
    private readonly category: Category,
    private readonly brand: string,
    private readonly unitOfMeasure: UnitOfMeasure,
    private readonly barcode: Barcode,
  ) {}

  static create(
    sku: SKU,
    name: string,
    description: string,
    category: Category,
    brand: string,
    unitOfMeasure: UnitOfMeasure,
    barcode: Barcode,
  ): Product {
    if (!name || name.trim().length === 0) {
      throw new Error("Product name cannot be empty");
    }
    if (!brand || brand.trim().length === 0) {
      throw new Error("Product brand cannot be empty");
    }
    return new Product(
      sku,
      name.trim(),
      description.trim(),
      category,
      brand.trim(),
      unitOfMeasure,
      barcode,
    );
  }

  getSku(): SKU {
    return this.sku;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): Category {
    return this.category;
  }

  getBrand(): string {
    return this.brand;
  }

  getUnitOfMeasure(): UnitOfMeasure {
    return this.unitOfMeasure;
  }

  getBarcode(): Barcode {
    return this.barcode;
  }
}
