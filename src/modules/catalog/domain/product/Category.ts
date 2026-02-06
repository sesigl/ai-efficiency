export class Category {
  private constructor(private readonly value: string) {}

  static create(value: string): Category {
    if (!value || value.trim().length === 0) {
      throw new Error("Category cannot be empty");
    }
    return new Category(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Category): boolean {
    return this.value === other.value;
  }
}
