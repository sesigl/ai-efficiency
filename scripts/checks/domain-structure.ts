/**
 * Domain Structure Check
 *
 * Validates that domain folders follow the aggregate root organization pattern:
 * - No files should be flat in /domain folders
 * - All domain files must be organized in aggregate root subfolders
 *
 * Example valid structure:
 *   domain/
 *     inventory-item/
 *       InventoryItem.ts
 *       InventoryItemRepository.ts
 *       Quantity.ts
 *
 * Example invalid structure:
 *   domain/
 *     InventoryItem.ts  <-- VIOLATION: flat file in domain
 */

import * as fs from "fs";
import * as path from "path";

interface Violation {
  file: string;
  reason: string;
}

function findModules(srcPath: string): string[] {
  const modulesPath = path.join(srcPath, "modules");
  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  return fs.readdirSync(modulesPath).filter((item) => {
    const itemPath = path.join(modulesPath, item);
    return fs.statSync(itemPath).isDirectory();
  });
}

function checkDomainStructure(modulePath: string): Violation[] {
  const domainPath = path.join(modulePath, "domain");
  const violations: Violation[] = [];

  if (!fs.existsSync(domainPath)) {
    return violations;
  }

  const items = fs.readdirSync(domainPath);

  for (const item of items) {
    const itemPath = path.join(domainPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile()) {
      const relativePath = path.relative(process.cwd(), itemPath);
      violations.push({
        file: relativePath,
        reason:
          "File found flat in domain/ folder. All domain files must be organized in aggregate root subfolders (e.g., domain/inventory-item/InventoryItem.ts)",
      });
    }
  }

  return violations;
}

function main(): void {
  const srcPath = path.join(process.cwd(), "src");
  const modules = findModules(srcPath);
  const allViolations: Violation[] = [];

  for (const moduleName of modules) {
    const modulePath = path.join(srcPath, "modules", moduleName);
    const violations = checkDomainStructure(modulePath);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("Domain Structure Check FAILED\n");
    console.error("The following violations were found:\n");

    for (const violation of allViolations) {
      console.error(`  ${violation.file}`);
      console.error(`    → ${violation.reason}\n`);
    }

    console.error(
      "Rule: Domain folders must not contain flat files. Organize all domain files into aggregate root subfolders.",
    );
    console.error(
      "Example: Instead of domain/InventoryItem.ts, use domain/inventory-item/InventoryItem.ts",
    );
    process.exit(1);
  }

  console.log("Domain Structure Check PASSED");
  console.log(`Checked ${modules.length} module(s): ${modules.join(", ")}`);
}

main();
