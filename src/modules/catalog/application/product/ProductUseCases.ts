import { Barcode } from "../../domain/product/Barcode.js";
import { Category } from "../../domain/product/Category.js";
import { Product } from "../../domain/product/Product.js";
import type { ProductRepository } from "../../domain/product/ProductRepository.js";
import { SKU } from "../../domain/product/Sku.js";
import { UnitOfMeasure } from "../../domain/product/UnitOfMeasure.js";

export interface RegisterProductCommand {
  name: string;
  description: string;
  category: string;
  brand: string;
  unitOfMeasure: string;
  barcode: string;
}

export interface SearchByCategoryQuery {
  category: string;
}

export interface ProductDTO {
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  unitOfMeasure: string;
  barcode: string;
}

export class ProductUseCases {
  constructor(private readonly repository: ProductRepository) {}

  registerProduct(command: RegisterProductCommand): ProductDTO {
    const sequence = this.repository.nextSequence();
    const sku = SKU.create(`PRD-${String(sequence).padStart(3, "0")}`);
    const category = Category.create(command.category);
    const unitOfMeasure = UnitOfMeasure.create(command.unitOfMeasure);
    const barcode = Barcode.create(command.barcode);

    const product = Product.create(
      sku,
      command.name,
      command.description,
      category,
      command.brand,
      unitOfMeasure,
      barcode,
    );

    this.repository.save(product);

    return this.toDTO(product);
  }

  searchByCategory(query: SearchByCategoryQuery): ProductDTO[] {
    const category = Category.create(query.category);
    const products = this.repository.findByCategory(category);

    return products.map((product) => this.toDTO(product));
  }

  private toDTO(product: Product): ProductDTO {
    return {
      sku: product.getSku().toString(),
      name: product.getName(),
      description: product.getDescription(),
      category: product.getCategory().toString(),
      brand: product.getBrand(),
      unitOfMeasure: product.getUnitOfMeasure().toString(),
      barcode: product.getBarcode().toString(),
    };
  }
}
