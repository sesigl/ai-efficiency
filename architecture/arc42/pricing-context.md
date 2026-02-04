# Pricing Bounded Context

## Responsibility
Calculate prices for products, apply promotions, and adjust pricing based on availability signals.

## Aggregate Root

### PriceEntry
- **Identity:** SKU (Stock Keeping Unit)
- **State:**
  - `basePrice`: original price
  - `promotions`: list of applicable promotions
- **Invariants:**
  - Base price must be positive
  - Promotions must be valid and non-overlapping in priority

## Value Objects

### Money
- Amount in cents (integer)
- Currency code
- Immutable
- Arithmetic operations (add, subtract, multiply, percentage)

### SKU
- Unique product identifier
- Immutable
- Format validation

### Promotion
- Name/type (e.g., BLACK_FRIDAY, CLEARANCE)
- Discount percentage or fixed amount
- Validity period (start/end dates)
- Conditions for application

### CalculatedPrice
- Final price after all adjustments
- Breakdown of applied discounts
- Original price reference

## Domain Services

### PriceCalculator
- Calculates final price based on:
  - Base price
  - Active promotions
  - Availability signal (from Warehouse contract)
- Rules:
  - If item is LOW stock → reduce discount
  - If item is OUT_OF_STOCK → no discount
  - Normal stock → full discount applies

### PromotionMatcher
- Determines which promotions apply to a SKU
- Handles promotion priority and stacking rules

## Use Cases

1. **SetBasePrice** - Configure base price for a SKU
2. **AddPromotion** - Add a promotion to a SKU
3. **RemovePromotion** - Remove a promotion from a SKU
4. **CalculatePrice** - Get final price considering promotions and availability
5. **GetPriceEntry** - Query price configuration

## Integration

### Consumes from Warehouse (via Published Language)
- **AvailabilitySignal** from `src/shared/contract/warehouse/`
- Used to adjust promotional discounts
- Pricing does NOT access Warehouse internals

### Adapter Pattern
- AvailabilityProvider interface in Pricing domain
- WarehouseAvailabilityAdapter in Pricing infrastructure
- Calls Warehouse application layer to get availability

## Infrastructure

- In-memory repository (can be replaced with persistent storage)
- WarehouseAvailabilityAdapter for cross-context communication
- DI container for dependency injection
