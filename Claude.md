# Development Guidance & Architecture

## 1. Knowledge Sources & Context
Before diving into code, use these files to orient yourself:
1.  **Dependency Cruiser Config:** Check this file to understand the strict folder structure and enforced dependency rules for DDD.
2.  **Architecture Folder (`architecture/`):** Refer to this for the "Big Picture".
    * `contexts.mermaid`: Defines Bounded Contexts and their relationships.

## 2. Philosophy & Style
Adhere to the combined philosophies of **Kent Beck** and **Uncle Bob**:
* **Simplicity:** Prefer simple solutions. Break behavior into small, specialized domain classes.
* **Clean Code:** Code must speak for itself. Variable and function names must be precise.
* **No Comments:** Do not write comments explaining "what" or "how".
    * *Exception:* You may write comments explaining the **"WHY"** behind unexpected logic or specific workarounds.

## 3. Testing Standards (Uncle Bob Style)
Tests are **First-Class Citizens**. They must be the same high quality as production code.

* **Zero Tolerance:** No duplication, no bad code, no mess. If it's hard to read, refactor it.
* **Fixtures & Factories:**
    * Complex setup must be extracted into **Factories** or **Builders**.
    * These must be placed in correct folders (e.g., `tests/fixtures` or within the module) for easy discovery.
    * **Relevance:** Tests should only show setup relevant to the behavior being tested. Use default parameters in Factories to hide irrelevant details.
* **Structure:**
    * Follow **Behavior Driven Testing**. 1 Test = 1 Behavior.
    * Implicit **Given-When-Then** structure (do not add comments labeling these sections; the code should make it obvious).
    * **Naming:** The test method title must be sufficient to understand *exactly* what behavior is being verified.
* **Assertions:**
    * Multiple assertions are allowed ONLY if they verify the same logical behavior.
    * **Complex Logic:** If assertions get complex, create dedicated **Asserter Classes** to enable reusability and readability.
* **Decoupling & Refactoring:**
    * Tests must rely on **behavior**, not implementation details.
    * Tests must avoid mocks by using real implementations if possible, testcontainers help here. in certain cases, like extern api, a fake/dummy/sub implementation can be created.
    * Tests must never block refactoring.
    * Tests must always use default parameters to make use of the default injected dependencies if possible. if provided for example a fake is necessary, the required dependency can be provided via constructor
* **Dependency Rules in Tests:**
    * Dependency direction applies to tests too.
    * **Application/Use Case Tests:** Do not rely on internal Domain or Infrastructure classes for setup if possible.
        * Instead, use **other Use Cases** or specialized Helper classes to read/mutate the state needed for the test. Creating use cases methods (and everything else below) only needed for tests is valid and must be treated like a real use case requirement following ddd and other principles.
        * Keep the test focused on the Application Layer's public API to cover each use cases. still have a several unit tests and small scoped integration tests where beneficial like aggregate roots.

## 4. Folder Structure
All code resides within strict **Bounded Contexts** at `src/modules/<ContextName>/`.

```text
src/modules/<ContextName>/
├── di.ts                 # Composition root - wires use cases with infrastructure
├── domain/               # Inner Core (Entities, VOs, Aggregates, Repository Interfaces)
├── application/          # Use Cases, Application Services
└── infrastructure/       # Implementations of domain interfaces (Repositories, Adapters)
    └── di.ts             # Infrastructure factory - creates implementations only

src/shared/
└── view/                 # contains formatting helper for views, eg to format dates
└── contract/<bounded-context-supplier>/  # contains exposed files to other bounded contexts which are the contract between both
```

## 5. Dependency Rules
Enforced via dependency-cruiser. **Build fails on violations.**

The dependency flow is:
```
api -> application -> domain <- infrastructure
```

* **Domain:** PURE. No imports from application or infrastructure.
* **Application:** Can import domain only.
* **Infrastructure:** Can import domain only. **Cannot import application.**
  * Implements domain interfaces (repositories, adapters, external clients)
  * The `infrastructure/di.ts` only creates infrastructure implementations
* **Module-level `di.ts`:** Composition root that wires application use cases with infrastructure
  * Can import from application, domain, and infrastructure
  * This is where dependency injection happens
* **API Layer:** Can import from module-level exports (use cases and containers)
* **shared:** Contains cross-context contracts. Access controlled via dependency-cruiser rules.

## 6. Documentation Maintenance
* **Trigger:** Creation of a new Bounded Context or Domain Concept.
* **Action:** Update:
    * `architecture/contexts.mermaid`: Context relationships and Shared Language contracts.

## 7. Technology Specifics
* **REST Framework:** Fastify - high-performance, TypeScript-first REST framework
* **Interface Layer:** Implemented via Fastify routes. Routes must not contain business logic; they delegate to Application layer use cases.
* **Validation:** Use Fastify's built-in JSON Schema validation for request/response validation
* **Diagrams:** Use Mermaid for all architectural diagrams

## 8. Verification
**Run `npm run verify` after each feature to ensure correctness.**

This command executes all mandatory checks:
1. **Biome format check:** Ensures consistent code formatting
2. **Biome lint:** Validates code quality rules
3. **dependency-cruiser:** Validates architectural rules (bounded context isolation, layer dependencies)
4. **TypeScript build:** Ensures type safety
5. **Tests:** Runs the full test suite

If any check fails, the feature is not complete. Fix all issues before committing.

**Useful commands:**
* `npm run format` - Auto-fix formatting issues
* `npm run lint` - Check for lint issues (use `npx biome lint --write` to auto-fix)

## 9. TypeScript Best Practices

### Imports & Exports
* **No export-only index.ts files:** Never create an `index.ts` that only exists to re-export modules. Always import classes, interfaces, and functions directly from their source files.
  * Bad: `import { SKU, Money } from "../domain/index.js"`
  * Good: `import { SKU } from "../domain/SKU.js"` and `import { Money } from "../domain/Money.js"`
* **Rationale:** Direct imports are explicit, improve IDE navigation, and prevent circular dependency issues.

### Type Definitions
* **Prefer `interface` over `type` for objects:** When defining object shapes, use `interface` rather than `type`.
  * Use `interface` for: object shapes, classes, function signatures that define contracts
  * Use `type` for: union types, intersection types, utility types, primitives, tuples
* **Use `import type`:** When importing only types, use `import type` to enable tree-shaking and make intent clear.
  * Example: `import type { PriceRepository } from "../domain/PriceRepository.js"`

## 10. Bounded Context Overview

### Pricing Context
- **Responsibility:** Calculate prices for products, apply promotions and discounts
- **Aggregate Root:** PriceEntry
- **Key Behaviors:**
  - Calculate base price for a product
  - Apply promotional discounts (e.g., Black Friday)
  - Adjust discounts based on availability signals

### Warehouse Context
- **Responsibility:** Manage inventory, track stock levels
- **Aggregate Root:** InventoryItem
- **Key Behaviors:**
  - Track stock quantities
  - Reserve items
  - Publish availability signals

### Integration Pattern
- **Relationship:** Customer-Supplier (Pricing is Customer, Warehouse is Supplier)
- **Published Language:** AvailabilitySignal contract
- **Rule:** Pricing cannot access Warehouse internals; it only consumes AvailabilitySignal
