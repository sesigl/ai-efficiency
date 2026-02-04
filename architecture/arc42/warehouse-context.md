# Warehouse Bounded Context

## Responsibility
Manage inventory, track stock levels, handle reservations, and publish availability signals.

## Aggregate Root

### InventoryItem
- **Identity:** SKU (Stock Keeping Unit)
- **State:**
  - `quantity`: current stock count
  - `reservations`: list of active reservations
- **Invariants:**
  - Quantity cannot be negative
  - Available quantity = quantity - sum(reservations)
  - Reservations must have valid expiration

## Value Objects

### SKU
- Unique product identifier
- Immutable
- Format validation

### Quantity
- Non-negative integer
- Immutable

### Reservation
- Reserved quantity
- Expiration timestamp
- Reference ID for tracking

## Domain Services

### AvailabilityCalculator
- Calculates availability level based on quantity thresholds
- Produces AvailabilitySignal for external consumers

## Published Language

### AvailabilitySignal
- Published to: `src/shared/contract/warehouse/`
- Contains:
  - `sku`: product identifier
  - `isLow`: boolean indicating low stock
  - `level`: HIGH | MEDIUM | LOW | OUT_OF_STOCK
- Consumers: Pricing context

## Use Cases

1. **AddStock** - Increase inventory quantity
2. **RemoveStock** - Decrease inventory quantity
3. **ReserveStock** - Create a reservation
4. **ReleaseReservation** - Remove a reservation
5. **GetAvailability** - Query availability signal for a SKU
6. **GetInventoryItem** - Query current inventory state

## Infrastructure

- In-memory repository (can be replaced with persistent storage)
- DI container for dependency injection
