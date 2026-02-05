# Development Guidance

## 1. Philosophy & Style
Adhere to the combined philosophies of **Kent Beck** and **Uncle Bob**:
* **Simplicity:** Prefer simple solutions. Break behavior into small, specialized classes.
* **Clean Code:** Code must speak for itself. Variable and function names must be precise.
* **No Comments:** Do not write comments explaining "what" or "how".
    * *Exception:* You may write comments explaining the **"WHY"** behind unexpected logic or specific workarounds.

## 2. Testing Standards
Tests are **First-Class Citizens**. They must be the same high quality as production code.

* **Zero Tolerance:** No duplication, no bad code, no mess. If it's hard to read, refactor it.
* **Fixtures & Factories:**
    * Complex setup must be extracted into **Factories** or **Builders**.
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
    * Tests must avoid mocks by using real implementations if possible.
    * Tests must never block refactoring.

## 3. Technology Specifics
* **REST Framework:** Fastify - high-performance, TypeScript-first REST framework
* **Interface Layer:** Implemented via Fastify routes. Routes must not contain business logic; they delegate to application layer use cases.
* **Validation:** Use Fastify's built-in JSON Schema validation for request/response validation

## 4. Verification
**Run `npm run verify` after each feature to ensure correctness.**

This command executes all mandatory checks:
1. **Biome format check:** Ensures consistent code formatting
2. **Biome lint:** Validates code quality rules
3. **ls-lint:** Validates file naming conventions
4. **knip:** Detects unused dependencies
5. **TypeScript build:** Ensures type safety
6. **Tests:** Runs the full test suite

If any check fails, the feature is not complete. Fix all issues before committing.

**Useful commands:**
* `npm run format` - Auto-fix formatting issues
* `npm run lint` - Check for lint issues (use `npx biome lint --write` to auto-fix)

## 5. TypeScript Best Practices

### Imports & Exports
* **No export-only index.ts files:** Never create an `index.ts` that only exists to re-export modules. Always import classes, interfaces, and functions directly from their source files.
* **Rationale:** Direct imports are explicit, improve IDE navigation, and prevent circular dependency issues.

### Type Definitions
* **Prefer `interface` over `type` for objects:** When defining object shapes, use `interface` rather than `type`.
  * Use `interface` for: object shapes, classes, function signatures that define contracts
  * Use `type` for: union types, intersection types, utility types, primitives, tuples
* **Use `import type`:** When importing only types, use `import type` to enable tree-shaking and make intent clear.
* **Dependency contracts must be classes or interfaces:** Fetchers, repositories, adapters, providers, and factories must be modeled as classes or interfaces, not function types, so fakes can implement the same contract.
