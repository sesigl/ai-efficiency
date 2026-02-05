# AI Efficiency with Bounded Contexts

## Goal

Compare AI-assisted development efficiency across two architectural approaches using the same supermarket management domain and identical use cases:

- **DDD / Bounded Contexts** — explicit context boundaries, strict layer separation, published contracts
- **Traditional Monolith** — logically organized by feature without explicit domain separation

The experiment measures how quickly and correctly an AI coding assistant implements features in each approach, and how well each architecture handles growing complexity over successive rounds of use case additions.

## Application Domain

A supermarket management system covering inventory tracking, product pricing with dynamic promotions, and product catalog management.

---

## Use Cases

### Base Use Cases (Already Implemented)

These use cases form the foundation of the application and are verified by the existing test suite.

**Warehouse**

| ID | Use Case | Description |
|----|----------|-------------|
| UC-W1 | Add stock | Add quantity to a SKU's inventory. Creates the item if new, increases quantity if existing. |
| UC-W2 | Remove stock | Decrease a SKU's inventory quantity. Rejects if SKU doesn't exist or quantity is insufficient. |
| UC-W3 | Reserve stock | Create a reservation that reduces available quantity without changing total stock. Returns confirmation with reservation ID. |
| UC-W4 | Release reservation | Cancel a reservation, restoring the reserved quantity back to available stock. |
| UC-W5 | Get inventory item | Retrieve stock details for a SKU: total quantity, available quantity, and active reservations. |
| UC-W6 | Get availability signal | Return an availability level (HIGH, LOW, OUT_OF_STOCK) based on available quantity thresholds. |

**Pricing**

| ID | Use Case | Description |
|----|----------|-------------|
| UC-P1 | Set base price | Set or update the base price for a SKU in a given currency. |
| UC-P2 | Add promotion | Attach a time-bound promotional discount to a SKU with type (BLACK_FRIDAY, CLEARANCE, SEASONAL, BULK_DISCOUNT), percentage, validity period, and priority. |
| UC-P3 | Remove promotion | Remove a named promotion from a SKU. |
| UC-P4 | Get price entry | Retrieve base price and all attached promotions for a SKU. |
| UC-P5 | Calculate price | Compute final price by applying active promotions, dynamically adjusted based on warehouse availability: full discount at HIGH stock, halved at LOW, none at OUT_OF_STOCK. |

**Cross-Context Integration**

| ID | Use Case | Description |
|----|----------|-------------|
| UC-I1 | Availability-adjusted pricing | Pricing queries Warehouse's availability signal through a published contract (AvailabilitySignal) to dynamically adjust promotional discounts. Uses the Adapter pattern; contexts never access each other's internals. |

### New Use Cases (To Be Implemented)

These use cases will be implemented in future prompts to measure development efficiency across architectural approaches.

#### Category A: 10 Use Cases in Existing Bounded Contexts

**Warehouse Context (5 use cases)**

| ID | Use Case | Description |
|----|----------|-------------|
| UC-A1 | Adjust stock after physical count | Replace the current stock quantity for a SKU with the actual count from a physical inventory audit. Returns the adjustment delta (difference between old and new quantity). If the SKU doesn't exist, creates it. |
| UC-A2 | Set reorder threshold | Configure a minimum stock level for a SKU. When available quantity drops to or below this threshold, the item is flagged as "needs reorder." |
| UC-A3 | List items needing reorder | Return all inventory items where available quantity is at or below the configured reorder threshold. |
| UC-A4 | Record shrinkage | Remove items from stock with a categorized reason (damaged, expired, theft). Tracked separately from normal stock removal for loss reporting. Rejects if insufficient stock. |
| UC-A5 | Get inventory summary | Return aggregated inventory overview: total SKUs tracked, total units in stock, count of items needing reorder, and count of out-of-stock items. |

**Pricing Context (5 use cases)**

| ID | Use Case | Description |
|----|----------|-------------|
| UC-A6 | Schedule future base price | Set a base price change that takes effect at a specified future date. Before that date, the current price remains active. After that date, calculatePrice uses the scheduled price. |
| UC-A7 | List active promotions | Return all currently active promotions across all SKUs, optionally filtered by promotion type. |
| UC-A8 | Create tiered bulk discount | Define quantity-based pricing tiers for a SKU (e.g., 1-9 units: full price, 10-49 units: 5% off, 50+ units: 15% off). When calculating price, a quantity parameter selects the applicable tier. |
| UC-A9 | Clone promotion to multiple SKUs | Copy an existing promotion's configuration (type, discount percentage, dates, priority) and apply it to a list of target SKUs. Returns count of successful clones and list of skipped SKUs (those without price entries). |
| UC-A10 | Calculate savings summary | For a given SKU, return a detailed breakdown: base price, each applied discount with name and amount saved, final price, total savings as both absolute amount and percentage. |

#### Category B: Cross-Context Integration Use Case (1)

| ID | Use Case | Description |
|----|----------|-------------|
| UC-B1 | Generate shelf label data | Produce a unified data structure for shelf labels combining data from both Pricing and Warehouse. Includes: SKU, calculated final price, original base price (shown only if discount active), savings percentage, and availability badge (In Stock / Low Stock / Out of Stock). Queries both contexts and merges their data without either context knowing about the other. |

#### Category C: New Bounded Context — Product Catalog (2)

These use cases require creating an entirely new bounded context that is fully isolated from the existing Warehouse and Pricing contexts.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-C1 | Register a product | Add a new product to the catalog with attributes: name, description, category (e.g., "Dairy", "Produce", "Beverages"), brand, unit of measure (kg, piece, liter, pack), and barcode. The SKU is assigned upon registration. |
| UC-C2 | Search products by category | Query the product catalog to find all products within a given category. Returns a list of matching products with their full catalog details. |

---

## Prompt Best Practices

The following principles guide all prompts in this experiment to ensure the AI produces high-quality, production-grade software:

1. **Be explicit about requirements** — State exact use cases with inputs, outputs, and error conditions. Ambiguity leads to assumptions and rework.
2. **Mandate the development process** — Require TDD (test-first), specify which layer tests target (API-level only), and require verification steps.
3. **Reference coding standards by file** — Point to `Claude.md` for conventions rather than repeating them. This keeps prompts focused on *what* to build, not *how* to code.
4. **Constrain scope precisely** — Define what to build and what NOT to build. Prevent the AI from adding unrequested features, refactoring existing code, or over-engineering.
5. **Separate prompts by phase** — Each prompt targets a specific batch of use cases. Smaller, focused prompts produce better results than monolithic ones.
6. **Define done** — Every use case is "done" when its API-level test passes and `npm run verify` succeeds.

---

## Claude.md and Flavor Differences

All flavors share identical coding best practices in their `Claude.md`:

- Clean Code and simplicity principles (Kent Beck + Uncle Bob)
- Testing standards (test quality, fixtures, behavior-driven testing, no mocks)
- TypeScript conventions (imports, type definitions, interface-first contracts)
- Verification process (`npm run verify`)

The **only** difference between flavors is the **architectural guidance** section:

| Aspect | DDD Flavor | Monolith Flavor |
|--------|-----------|-----------------|
| Folder structure | `src/modules/<Context>/{domain,application,infrastructure}` | `src/{services,models,routes}` or similar flat feature grouping |
| Dependency rules | Enforced via dependency-cruiser: `api -> application -> domain <- infrastructure` | No explicit layer enforcement |
| Cross-feature communication | Published contracts in `src/shared/contract/`, Adapter pattern | Direct imports between services |
| Architectural validation | dependency-cruiser rules fail build on violations | No architectural validation tooling |

---

## Prompts

### Prompt 1: Create Base Application

#### DDD / Bounded Contexts Flavor

```
Create a supermarket management system using Domain-Driven Design with strict
bounded context separation.

Refer to Claude.md for all coding standards, testing practices, folder structure,
and architectural dependency rules.

## Bounded Contexts and Use Cases

[BASE_USE_CASES]

## Integration Rules

The Pricing context must never access Warehouse internals. Cross-context
communication happens exclusively through the AvailabilitySignal published
contract. Use the Adapter pattern at the infrastructure layer to bridge contexts.

## Development Process

1. For each use case, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the application layer's public API only
3. Do NOT write implementation code until the test for that use case exists and
   fails
4. Each use case must have at least one test verifying its core behavior
5. Only create API-level tests — do not create separate unit tests for domain
   classes
6. Run `npm run verify` after completing all use cases to ensure every check
   passes
```

#### Monolith Flavor

```
Create a supermarket management system for tracking inventory and managing
product pricing with promotions.

Refer to Claude.md for all coding standards and testing practices.

## Features

The system needs to:

Stock Management:
- Add inventory for products identified by SKU, creating the product entry if
  it doesn't exist yet
- Remove inventory quantities, rejecting if the product doesn't exist or stock
  is insufficient
- Temporarily reserve inventory for pending orders, reducing the available
  quantity
- Release reservations to restore available stock
- Look up current stock details for any product
- Check stock availability level (high, low, or out of stock) based on
  available quantity

Pricing:
- Set or update the base price for a product
- Attach promotional discounts to products with a type, discount percentage,
  validity period, and priority
- Remove promotions by name
- Look up price details and attached promotions for a product
- Calculate the final price for a product applying all active promotions,
  automatically reducing discounts when stock is running low and skipping
  them entirely when out of stock

Use TypeScript with Fastify for the REST API. Store data in memory. Organize
code in a clean, logical way by feature area.

## Development Process

1. For each feature, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the public service/API layer only
3. Do NOT write implementation code until the test exists and fails
4. Each feature must have at least one test verifying its core behavior
5. Only create API-level tests — do not create separate unit tests for internal
   classes
6. Run `npm run verify` after completing all features to ensure every check
   passes
```

### Prompt 2: Add Category A Use Cases

#### DDD / Bounded Contexts Flavor

```
Add the following use cases to the existing bounded contexts:

[CATEGORY_A_USE_CASES]

Refer to Claude.md for all coding standards, folder structure, and dependency
rules.

Each use case belongs to its respective bounded context. Follow the existing
patterns for domain modeling, application services, and infrastructure wiring.

## Development Process

1. For each use case, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the application layer's public API only
3. Do NOT write implementation code until the test exists and fails
4. Only create API-level tests
5. Run `npm run verify` after all use cases are complete
```

#### Monolith Flavor

```
Add the following features to the existing application:

[CATEGORY_A_USE_CASES — rephrased as flat feature descriptions without
bounded context or DDD terminology]

Refer to Claude.md for all coding standards and testing practices.

## Development Process

1. For each feature, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the public service/API layer only
3. Do NOT write implementation code until the test exists and fails
4. Only create API-level tests
5. Run `npm run verify` after all features are complete
```

### Prompt 3: Add Category B Use Case (Cross-Context Integration)

#### DDD / Bounded Contexts Flavor

```
Add the following cross-context integration use case:

[CATEGORY_B_USE_CASE]

This use case requires data from both the Pricing and Warehouse bounded
contexts. Follow the existing integration pattern:
- Create a new application service or use case that depends on abstract
  interfaces from both contexts
- Wire the integration at the composition root (infrastructure/di.ts)
- Neither context may import from the other directly

Refer to Claude.md for all coding standards and integration patterns.

## Development Process

1. Write the API-level test FIRST (TDD)
2. Do NOT implement until the test exists and fails
3. Only create API-level tests
4. Run `npm run verify` when complete
```

#### Monolith Flavor

```
Add the following feature to the existing application:

[CATEGORY_B_USE_CASE — rephrased as a flat feature description]

This feature combines pricing and inventory data into a single response.

Refer to Claude.md for all coding standards and testing practices.

## Development Process

1. Write the API-level test FIRST (TDD)
2. Do NOT implement until the test exists and fails
3. Only create API-level tests
4. Run `npm run verify` when complete
```

### Prompt 4: Add Category C Use Cases (New Bounded Context)

#### DDD / Bounded Contexts Flavor

```
Create a new Product Catalog bounded context and implement these use cases:

[CATEGORY_C_USE_CASES]

This context is fully independent — it must NOT depend on Warehouse or Pricing.
Follow the same bounded context structure defined in Claude.md:
- domain/ with aggregate root, value objects, and repository interface
- application/ with use cases
- infrastructure/ with repository implementation and di.ts composition root
- API routes under src/api/

Update architecture/contexts.mermaid with the new context.

Refer to Claude.md for all coding standards, folder structure, and dependency
rules.

## Development Process

1. For each use case, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the application layer's public API only
3. Do NOT write implementation code until the test exists and fails
4. Only create API-level tests
5. Run `npm run verify` when complete
```

#### Monolith Flavor

```
Add product catalog functionality to the existing application:

[CATEGORY_C_USE_CASES — rephrased as flat feature descriptions]

Products should be manageable independently from pricing and inventory features.

Refer to Claude.md for all coding standards and testing practices.

## Development Process

1. For each feature, write the API-level test FIRST (TDD)
2. Tests must verify behavior through the public service/API layer only
3. Do NOT write implementation code until the test exists and fails
4. Only create API-level tests
5. Run `npm run verify` when complete
```
