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

### Base Use Cases (Baseline - that's where an application starts)

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

#### Category D: B2B Wholesale (New Parallel Domain)

These use cases introduce a "Wholesale" side to the business. It deals with "Prices" and "Stock" just like the retail side, but the rules are fundamentally different.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-D1 | Register B2B Client | Register a corporate client with a specific "Contract Tier" (Silver, Gold, Platinum). |
| UC-D2 | Set Wholesale Price | Set a price for a SKU specific to the wholesale channel. This is distinct from the Retail Base Price. |
| UC-D3 | Calculate Contract Price | Calculate price for a B2B Client. Logic: Wholesale Base Price * Contract Tier Multiplier (Silver: 1.0, Gold: 0.9, Platinum: 0.85). strictly ignores Retail promotions. |
| UC-D4 | Reserve Bulk Stock | Reserve stock for B2B. Logic: Can only reserve if quantity > 100. Decrements from the *same* physical warehouse inventory as retail (shared resource). |

#### Category E: Supplier Management (Upstream Domain)

Focuses on the intake of goods.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-E1 | Onboard Supplier | Create a supplier profile with lead time (in days) and reliability rating. |
| UC-E2 | Create Purchase Order | Create a PO for a Supplier for a specific SKU and quantity. |
| UC-E3 | Receive Goods | Process a PO delivery. Increases the physical stock in the Warehouse. Updates the "Average Cost" of the SKU based on the PO price. |

#### Category F: Returns & Quality (Downstream Workflow)

Handling items coming back from customers.

| ID | Use Case | Description |
|----|----------|-------------|
| UC-F1 | Initiate Return | Open a return ticket for a SKU. Reason: (Defective, Unwanted, Wrong Item). |
| UC-F2 | Process QC Inspection | Record result of Quality Control. Status: (Restockable, Discard). |
| UC-F3 | Finalize Return | If Restockable: Increment Warehouse stock. If Discard: Record Shrinkage (Warehouse). Regardless: Trigger a refund calculation (Pricing). |

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


Create a supermarket management system using Domain-Driven Design with strict
bounded context separation.
Refer to Claude.md for all coding standards, testing practices, folder structure,
and architectural dependency rules.
Bounded Contexts and Use Cases
Warehouse Context
 * UC-W1: Add stock — Add quantity to a SKU's inventory. Creates the item if new, increases quantity if existing.
 * UC-W2: Remove stock — Decrease a SKU's inventory quantity. Rejects if SKU doesn't exist or quantity is insufficient.
 * UC-W3: Reserve stock — Create a reservation that reduces available quantity without changing total stock. Returns confirmation with reservation ID.
 * UC-W4: Release reservation — Cancel a reservation, restoring the reserved quantity back to available stock.
 * UC-W5: Get inventory item — Retrieve stock details for a SKU: total quantity, available quantity, and active reservations.
 * UC-W6: Get availability signal — Return an availability level (HIGH, LOW, OUT_OF_STOCK) based on available quantity thresholds.
Pricing Context
 * UC-P1: Set base price — Set or update the base price for a SKU in a given currency.
 * UC-P2: Add promotion — Attach a time-bound promotional discount to a SKU with type (BLACK_FRIDAY, CLEARANCE, SEASONAL, BULK_DISCOUNT), percentage, validity period, and priority.
 * UC-P3: Remove promotion — Remove a named promotion from a SKU.
 * UC-P4: Get price entry — Retrieve base price and all attached promotions for a SKU.
 * UC-P5: Calculate price — Compute final price by applying active promotions, dynamically adjusted based on warehouse availability: full discount at HIGH stock, halved at LOW, none at OUT_OF_STOCK.
Cross-Context Integration
 * UC-I1: Availability-adjusted pricing — Pricing queries Warehouse's availability signal through a published contract (AvailabilitySignal) to dynamically adjust promotional discounts. Uses the Adapter pattern; contexts never access each other's internals.
Integration Rules
The Pricing context must never access Warehouse internals. Cross-context
communication happens exclusively through the AvailabilitySignal published
contract. Use the Adapter pattern at the infrastructure layer to bridge contexts.
Development Process
 * For each use case, there are already the API-level tests
 * Each test must pass. make one api test pass at a time
 * Run npm run verify after completing all use cases to ensure every check
   passes
<!-- end list -->

#### Monolith Flavor


Create a supermarket management system for tracking inventory and managing
product pricing with promotions.
Refer to Claude.md for all coding standards and testing practices.
Features
The system needs to:
Stock Management:
 * Add inventory for products identified by SKU, creating the product entry if
   it doesn't exist yet
 * Remove inventory quantities, rejecting if the product doesn't exist or stock
   is insufficient
 * Temporarily reserve inventory for pending orders, reducing the available
   quantity
 * Release reservations to restore available stock
 * Look up current stock details for any product
 * Check stock availability level (high, low, or out of stock) based on
   available quantity
Pricing:
 * Set or update the base price for a product
 * Attach promotional discounts to products with a type, discount percentage,
   validity period, and priority
 * Remove promotions by name
 * Look up price details and attached promotions for a product
 * Calculate the final price for a product applying all active promotions,
   automatically reducing discounts when stock is running low and skipping
   them entirely when out of stock
Use TypeScript with Fastify for the REST API. Store data in memory. Organize
code in a clean, logical way by feature area.
Development Process
 * For each use case, there are already the API-level tests
 * Each test must pass. make one api test pass at a time
 * Run npm run verify after completing all use cases to ensure every check
<!-- end list -->

### Prompt 2: Add Category A Use Cases

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add the following use cases to the existing bounded contexts:
Warehouse Context (5 use cases)
 * UC-A1: Adjust stock after physical count — Replace the current stock quantity for a SKU with the actual count from a physical inventory audit. Returns the adjustment delta (difference between old and new quantity). If the SKU doesn't exist, creates it.
 * UC-A2: Set reorder threshold — Configure a minimum stock level for a SKU. When available quantity drops to or below this threshold, the item is flagged as "needs reorder."
 * UC-A3: List items needing reorder — Return all inventory items where available quantity is at or below the configured reorder threshold.
 * UC-A4: Record shrinkage — Remove items from stock with a categorized reason (damaged, expired, theft). Tracked separately from normal stock removal for loss reporting. Rejects if insufficient stock.
 * UC-A5: Get inventory summary — Return aggregated inventory overview: total SKUs tracked, total units in stock, count of items needing reorder, and count of out-of-stock items.
Pricing Context (5 use cases)
 * UC-A6: Schedule future base price — Set a base price change that takes effect at a specified future date. Before that date, the current price remains active. After that date, calculatePrice uses the scheduled price.
 * UC-A7: List active promotions — Return all currently active promotions across all SKUs, optionally filtered by promotion type.
 * UC-A8: Create tiered bulk discount — Define quantity-based pricing tiers for a SKU (e.g., 1-9 units: full price, 10-49 units: 5% off, 50+ units: 15% off). When calculating price, a quantity parameter selects the applicable tier.
 * UC-A9: Clone promotion to multiple SKUs — Copy an existing promotion's configuration (type, discount percentage, dates, priority) and apply it to a list of target SKUs. Returns count of successful clones and list of skipped SKUs (those without price entries).
 * UC-A10: Calculate savings summary — For a given SKU, return a detailed breakdown: base price, each applied discount with name and amount saved, final price, total savings as both absolute amount and percentage.
Refer to Claude.md for all coding standards, folder structure, and dependency
rules.
Each use case belongs to its respective bounded context. Follow the existing
patterns for domain modeling, application services, and infrastructure wiring.
Development Process
 * For each use case, write the API-level test FIRST (TDD)
 * Tests must verify behavior through the application layer's public API only
 * Do NOT write implementation code until the test exists and fails
 * Only create API-level tests
 * Run npm run verify after all use cases are complete
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add the following features to the existing application:
Stock Management:
 * Adjust stock after physical count: Replace the current stock quantity for a
   product with the actual count from a physical inventory audit. Returns the
   adjustment delta. If the product doesn't exist, creates it.
 * Set reorder threshold: Configure a minimum stock level for a product. When
   available quantity drops to or below this threshold, flag it as "needs reorder."
 * List items needing reorder: Return all inventory items where available quantity
   is at or below the configured reorder threshold.
 * Record shrinkage: Remove items from stock with a categorized reason (damaged,
   expired, theft). Track separately from normal stock removal for loss reporting.
   Reject if insufficient stock.
 * Get inventory summary: Return aggregated overview: total products tracked,
   total units in stock, count of items needing reorder, and count of out-of-stock
   items.
Pricing:
 * Schedule future base price: Set a base price change that takes effect at a
   specified future date. Before that date, the current price remains active.
 * List active promotions: Return all currently active promotions across all
   products, optionally filtered by promotion type.
 * Create tiered bulk discount: Define quantity-based pricing tiers for a product
   (e.g., 1-9 units: full price, 10-49 units: 5% off, 50+ units: 15% off). When
   calculating price, a quantity parameter selects the applicable tier.
 * Clone promotion to multiple products: Copy an existing promotion's
   configuration and apply it to a list of target products. Returns count of
   successful clones and list of skipped products (those without price entries).
 * Calculate savings summary: For a given product, return a detailed breakdown:
   base price, each applied discount with name and amount saved, final price,
   total savings as both absolute amount and percentage.
Refer to Claude.md for all coding standards and testing practices.
Development Process
 * For each feature, write the API-level test FIRST (TDD)
 * Tests must verify behavior through the public service/API layer only
 * Do NOT write implementation code until the test exists and fails
 * Only create API-level tests
 * Run npm run verify after all features are complete
   """
<!-- end list -->

### Prompt 3: Add Category B Use Case (Cross-Context Integration)

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add the following cross-context integration use case:
UC-B1: Generate shelf label data — Produce a unified data structure for
shelf labels combining data from both Pricing and Warehouse. Includes: SKU,
calculated final price, original base price (shown only if discount active),
savings percentage, and availability badge (In Stock / Low Stock / Out of
Stock). Queries both contexts and merges their data without either context
knowing about the other.
This use case requires data from both the Pricing and Warehouse bounded
contexts. Follow the existing integration pattern:
 * Create a new application service or use case that depends on abstract
   interfaces from both contexts
 * Wire the integration at the composition root (infrastructure/di.ts)
 * Neither context may import from the other directly
Refer to Claude.md for all coding standards and integration patterns.
Development Process
 * Write the API-level test FIRST (TDD)
 * Do NOT implement until the test exists and fails
 * Only create API-level tests
 * Run npm run verify when complete
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add the following feature to the existing application:
Generate shelf label data: Produce a unified data structure for shelf labels
combining pricing and inventory data. Includes: product SKU, calculated final
price, original base price (shown only if a discount is active), savings
percentage, and availability badge (In Stock / Low Stock / Out of Stock).
This feature combines pricing and inventory data into a single response.
Refer to Claude.md for all coding standards and testing practices.
Development Process
 * Write the API-level test FIRST (TDD)
 * Do NOT implement until the test exists and fails
 * Only create API-level tests
 * Run npm run verify when complete
   """
<!-- end list -->

### Prompt 4: Add Category C Use Cases (New Bounded Context)

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Create a new Product Catalog bounded context and implement these use cases:
 * UC-C1: Register a product — Add a new product to the catalog with attributes: name, description, category (e.g., "Dairy", "Produce", "Beverages"), brand, unit of measure (kg, piece, liter, pack), and barcode. The SKU is assigned upon registration.
 * UC-C2: Search products by category — Query the product catalog to find all products within a given category. Returns a list of matching products with their full catalog details.
This context is fully independent — it must NOT depend on Warehouse or Pricing.
Follow the same bounded context structure defined in Claude.md:
 * domain/ with aggregate root, value objects, and repository interface
 * application/ with use cases
 * infrastructure/ with repository implementation and di.ts composition root
 * API routes under src/api/
Update architecture/contexts.mermaid with the new context.
Refer to Claude.md for all coding standards, folder structure, and dependency
rules.
Development Process
 * For each use case, write the API-level test FIRST (TDD)
 * Tests must verify behavior through the application layer's public API only
 * Do NOT write implementation code until the test exists and fails
 * Only create API-level tests
 * Run npm run verify when complete
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add product catalog functionality to the existing application:
 * Register a product: Add a new product to the catalog with attributes: name,
   description, category (e.g., "Dairy", "Produce", "Beverages"), brand, unit of
   measure (kg, piece, liter, pack), and barcode. The SKU is assigned upon
   registration.
 * Search products by category: Query the product catalog to find all products
   within a given category. Returns a list of matching products with their full
   catalog details.
Products should be manageable independently from pricing and inventory features.
Refer to Claude.md for all coding standards and testing practices.
Development Process
 * For each feature, write the API-level test FIRST (TDD)
 * Tests must verify behavior through the public service/API layer only
 * Do NOT write implementation code until the test exists and fails
 * Only create API-level tests
 * Run npm run verify when complete
   """
<!-- end list -->

### Prompt 5: Add Category D (B2B Wholesale)

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Create a new Wholesale Bounded Context.
Context Constraints
CRITICAL: This context is isolated from the Retail Pricing logic.
 * You do NOT need to read, index, or analyze src/modules/Pricing.
 * You do NOT need to read src/modules/Catalog.
 * Focus ONLY on creating the new module src/modules/Wholesale.
 * You WILL need to integrate with Warehouse for stock reservation via the existing AvailabilitySignal or a new contract.
Use Cases
 * UC-D1: Register B2B Client — Register a corporate client with a specific "Contract Tier" (Silver, Gold, Platinum).
 * UC-D2: Set Wholesale Price — Set a price for a SKU specific to the wholesale channel. This is distinct from the Retail Base Price.
 * UC-D3: Calculate Contract Price — Calculate price for a B2B Client. Logic: Wholesale Base Price * Contract Tier Multiplier (Silver: 1.0, Gold: 0.9, Platinum: 0.85). Strictly ignores Retail promotions.
 * UC-D4: Reserve Bulk Stock — Reserve stock for B2B. Logic: Can only reserve if quantity > 100. Decrements from the same physical warehouse inventory as retail. Use an infrastructure adapter to talk to the Warehouse context.
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add B2B Wholesale features to the existing application.
These features must coexist with the existing Retail Pricing and Inventory logic.
Features
 * Register B2B Client: Store corporate clients with a "Contract Tier" (Silver, Gold, Platinum).
 * Set Wholesale Price: Set a price for a product that applies only to B2B sales. This must be stored alongside or linked to the product, distinct from the retail price.
 * Calculate Contract Price: Logic: Wholesale Base Price * Contract Tier Multiplier (Silver: 1.0, Gold: 0.9, Platinum: 0.85). This must NOT apply any Retail promotions (Black Friday, etc).
 * Reserve Bulk Stock: Reserve inventory for B2B orders. Restriction: Can only reserve if quantity > 100. This impacts the main inventory levels just like retail reservations do.
Ensure you reuse existing data structures where appropriate but prevent B2B logic from breaking Retail logic.
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->

### Prompt 6: Add Category E (Supplier Management)

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Create a new Procurement Bounded Context.
Context Constraints
 * You do NOT need to read Pricing, Wholesale, or Catalog.
 * Focus on src/modules/Procurement.
 * You will need to send a command/signal to Warehouse to increase stock.
Use Cases
 * UC-E1: Onboard Supplier — Create a supplier profile with lead time (in days) and reliability rating.
 * UC-E2: Create Purchase Order — Create a PO for a Supplier for a specific SKU and quantity. Status starts as "PENDING".
 * UC-E3: Receive Goods — Process a PO delivery.
   * Updates PO status to "RECEIVED".
   * Integrates with Warehouse to add the quantity to physical stock.
   * Updates the "Average Cost" of the SKU (Simple Moving Average) based on the PO price. Note: Average Cost belongs to Procurement, not Pricing.
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add Supplier and Purchase Order features to the application.
Features
 * Onboard Supplier: Create a supplier profile with lead time and reliability rating.
 * Create Purchase Order: Create a PO for a Supplier for a specific SKU and quantity.
 * Receive Goods: Process a PO delivery.
   * Updates PO status.
   * Adds the received quantity to the existing Inventory system.
   * Updates a new "Average Cost" field for the product (Simple Moving Average) based on the PO price.
Ensure this integrates with the existing Stock Management logic.
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->

### Prompt 7: Add Category F (Returns & Quality)

#### DDD / Bounded Contexts Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Create a new Returns Bounded Context.
Context Constraints
 * You are acting as an orchestrator of a workflow.
 * You do NOT need to read the internal logic of Procurement or Catalog.
 * You will need to trigger actions in Warehouse (adjust stock) and Pricing (calculate refund).
Use Cases
 * UC-F1: Initiate Return — Open a return ticket for a SKU. Inputs: SKU, Quantity, Reason (Defective, Unwanted, Wrong Item).
 * UC-F2: Process QC Inspection — Record result of Quality Control on a return ticket. Status: (Restockable, Discard).
 * UC-F3: Finalize Return — Complete the workflow:
   * If Restockable: Call Warehouse to Add Stock.
   * If Discard: Call Warehouse to Record Shrinkage (Reuse existing Use Case UC-A4).
   * Regardless of QC: Call Pricing to Calculate Refund Amount (Use existing Calculate Price logic, but return it as a refund value).
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->

#### Monolith Flavor


It’s 9:05 UTC+7 , I want you to create a stats.md in the root folder that contains log entries, this first log you begin working on a set of use cases. Once you are done with everything you log again an entry. Not to the start that we use opus 4.6.
Here is your task:"""
Add Returns and Quality Control features to the application.
Features
 * Initiate Return: Open a return ticket for a product. Inputs: SKU, Quantity, Reason.
 * Process QC Inspection: Record result of Quality Control. Status: (Restockable, Discard).
 * Finalize Return:
   * If Restockable: Add the quantity back to inventory.
   * If Discard: Trigger the existing Shrinkage logic.
   * Calculate the refund value using the existing price calculation logic.
You must weave this logic into the existing services (Inventory and Pricing) to reuse their functionality without duplicating code.
Development Process
 * Write API-level tests FIRST (TDD)
 * Do NOT implement until tests fail
 * Run npm run verify
   """
<!-- end list -->
# AI Efficiency Benchmark

A project designed to measure agentic AI coding performance. AI coding agents implement features based on a well-defined specification via API-level tests.

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
- Efficiency metrics capture implementation cost (tokens, time, ...)

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **REST Framework:** Fastify
- **Testing:** Vitest
- **Code Quality:** Biome (linting & formatting), ls-lint (file naming), knip (unused deps)

## Getting Started

```bash
npm install
npm run build
npm test

Available Scripts
| Script | Description |
|---|---|
| npm run build | Compile TypeScript |
| npm start | Run the compiled server |
| npm run dev | Run in development mode |
| npm test | Run tests |
| npm run test:watch | Run tests in watch mode |
| npm run test:coverage | Run tests with coverage |
| npm run lint | Lint source files |
| npm run format | Auto-format source files |
| npm run verify | Run all checks (format, lint, build, test) |
API Endpoints
Health Check
 * GET /health - Service health status
<!-- end list -->

