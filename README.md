# AI Efficiency with Bounded Contexts

A supermarket application demonstrating Domain-Driven Design (DDD) with bounded contexts. This project is designed to measure agentic AI coding performance.

## Purpose

This repository is structured specifically for evaluating how efficiently AI coding agents can implement features when working with a well-defined specification via API-level tests.

### API-Level Tests Only

**Intentionally, all tests in this repository are at the API level.** This design choice ensures:

1. **Behavior-Driven Specification**: Tests define the expected external behavior without prescribing internal implementation details
2. **Implementation Freedom**: AI agents (or human developers) can choose any internal architecture, patterns, or code structure
3. **Measurable Outcomes**: Success is objectively measured by whether the API contracts are satisfied
4. **Consistent Comparison**: Different implementations can be fairly compared since they must all pass the same API tests

### Measuring Agentic Coding Performance

The API tests serve as an executable specification. When an AI agent is tasked with implementing features:

- The tests define **what** the system should do
- The agent decides **how** to implement it
- Efficiency metrics capture implementation cost (tokens, time, iterations)

## Branch Structure

### Main Branch
The `main` branch contains the reference implementation with all API tests passing.

### Flavor Branches
Branches prefixed with `flavor/` contain alternative implementations:

- `flavor/minimal` - Minimal implementation approach
- `flavor/ddd-clean-arch` - Domain-Driven Design with Clean Architecture
- `flavor/functional` - Functional programming approach
- etc.

Each flavor branch demonstrates a different architectural approach while satisfying the same API tests.

### Stats Tracking
Every branch (main and flavor branches) includes a `stats.md` file documenting:

- Implementation efficiency metrics
- Token usage for AI-assisted development
- Time to implement features
- Number of iterations/attempts
- Code complexity metrics

## Application Overview

The supermarket system has two bounded contexts:

### Warehouse Context
- Manages inventory stock levels
- Handles stock reservations
- Publishes availability signals (HIGH, LOW, OUT_OF_STOCK)

### Pricing Context
- Sets base prices for products
- Manages promotions with validity periods
- Calculates final prices based on warehouse availability:
  - **HIGH stock**: Full promotion discount applied
  - **LOW stock**: 50% of promotion discount applied
  - **OUT_OF_STOCK**: No discount applied

## Running Tests

```bash
npm install
npm test
```

## API Endpoints

### Warehouse API
- `POST /warehouse/stock/add` - Add stock
- `POST /warehouse/stock/remove` - Remove stock
- `POST /warehouse/reservations` - Create reservation
- `DELETE /warehouse/reservations/:sku/:reservationId` - Release reservation
- `GET /warehouse/inventory/:sku` - Get inventory details
- `GET /warehouse/availability/:sku` - Get availability signal

### Pricing API
- `POST /pricing/base-price` - Set/update base price
- `POST /pricing/promotions` - Add promotion
- `DELETE /pricing/promotions/:sku/:promotionName` - Remove promotion
- `GET /pricing/entries/:sku` - Get price entry
- `GET /pricing/calculate/:sku` - Calculate final price with discounts

### Health Check
- `GET /health` - Service health status

## Test Coverage

The API tests cover:
- All happy path scenarios
- Edge cases (zero quantities, non-existent SKUs, duplicate promotions)
- Cross-context integration (pricing reacts to warehouse availability)
- Reservation impact on availability and pricing
- Temporal aspects (promotion validity periods)

Total: 43 API tests ensuring complete behavioral coverage.
