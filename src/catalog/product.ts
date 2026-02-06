export class Product {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: string,
    public readonly brand: string,
    public readonly unitOfMeasure: string,
    public readonly barcode: string,
  ) {}
}
