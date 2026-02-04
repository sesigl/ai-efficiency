/**
 * Infrastructure Structure Check
 *
 * Validates that infrastructure folders follow the technical concern organization pattern:
 * - Only di.ts is allowed at the infrastructure/ root level
 * - All other infrastructure files must be in technical concern subfolders
 *
 * Example valid structure:
 *   infrastructure/
 *     di.ts                                         <-- OK: allowed at root
 *     persistence/
 *       in-memory/
 *         InMemoryInventoryItemRepository.ts       <-- OK: in technical subfolder
 *       postgres/
 *         PostgresInventoryItemRepository.ts       <-- OK: in technical subfolder
 *
 * Example invalid structure:
 *   infrastructure/
 *     di.ts
 *     InMemoryInventoryItemRepository.ts           <-- VIOLATION: not in subfolder
 */

import * as fs from "fs";
import * as path from "path";

interface Violation {
  file: string;
  reason: string;
}

const ALLOWED_ROOT_FILES = ["di.ts"];

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

function checkInfrastructureStructure(modulePath: string): Violation[] {
  const infraPath = path.join(modulePath, "infrastructure");
  const violations: Violation[] = [];

  if (!fs.existsSync(infraPath)) {
    return violations;
  }

  const items = fs.readdirSync(infraPath);

  for (const item of items) {
    const itemPath = path.join(infraPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile() && !ALLOWED_ROOT_FILES.includes(item)) {
      const relativePath = path.relative(process.cwd(), itemPath);
      violations.push({
        file: relativePath,
        reason: `File found at infrastructure/ root level. Only ${ALLOWED_ROOT_FILES.join(", ")} is allowed at root. Other files must be in technical concern subfolders (e.g., infrastructure/persistence/in-memory/)`,
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
    const violations = checkInfrastructureStructure(modulePath);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("Infrastructure Structure Check FAILED\n");
    console.error("The following violations were found:\n");

    for (const violation of allViolations) {
      console.error(`  ${violation.file}`);
      console.error(`    → ${violation.reason}\n`);
    }

    console.error(
      `Rule: Only ${ALLOWED_ROOT_FILES.join(", ")} is allowed at the infrastructure/ root level.`,
    );
    console.error(
      "Other implementation files must be organized in technical concern subfolders.",
    );
    console.error(
      "Example: Instead of infrastructure/InMemoryRepo.ts, use infrastructure/persistence/in-memory/InMemoryRepo.ts",
    );
    process.exit(1);
  }

  console.log("Infrastructure Structure Check PASSED");
  console.log(`Checked ${modules.length} module(s): ${modules.join(", ")}`);
}

main();
