import { fileURLToPath } from "node:url";
import { findImportViolations } from "./findImportViolations.ts";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
const violations = await findImportViolations(workspaceRoot);
for (const violation of violations) {
  console.error(
    `${violation.file}:${String(violation.line)} ${violation.message}`,
  );
}
if (violations.length > 0) {
  console.error(
    `${String(violations.length)} imports break the dependency rules in docs/design/01-architecture.md.`,
  );
  process.exitCode = 1;
}
