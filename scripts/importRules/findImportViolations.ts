import { readdir, readFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  browserPackages,
  permittedImports,
  tableRowOf,
} from "./dependencyTable.ts";
import { importsOfFile, type FoundImport } from "./importsOfFile.ts";

export interface ImportViolation {
  file: string;
  line: number;
  message: string;
}

interface WorkspacePackage {
  folder: string;
  name: string;
  row: string;
}

const packageGroups = ["packages", "apps", "tools"];
const skippedFolders = new Set([
  "node_modules",
  "dist",
  ".tsbuild",
  "coverage",
]);
const codeFilePattern = /\.(?:[cm]?[jt]s|tsx|jsx)$/;

async function workspacePackages(root: string): Promise<WorkspacePackage[]> {
  const found: WorkspacePackage[] = [];
  for (const group of packageGroups) {
    const entries = await readdir(join(root, group), { withFileTypes: true });
    for (const entry of entries.filter((candidate) =>
      candidate.isDirectory(),
    )) {
      const folder = `${group}/${entry.name}`;
      const manifest: unknown = JSON.parse(
        await readFile(join(root, folder, "package.json"), "utf8"),
      );
      const name =
        typeof manifest === "object" && manifest !== null && "name" in manifest
          ? String(manifest.name)
          : folder;
      found.push({ folder, name, row: tableRowOf(folder) });
    }
  }
  return found;
}

async function codeFilesOf(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        return skippedFolders.has(entry.name) ? [] : codeFilesOf(path);
      }
      return codeFilePattern.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

function isNodeModule(importName: string): boolean {
  const [firstPart = ""] = importName.split("/");
  return importName.startsWith("node:") || builtinModules.includes(firstPart);
}

function violationOf(options: {
  found: FoundImport;
  file: string;
  folder: string;
  workspacePackage: WorkspacePackage;
}): string | undefined {
  const { found, file, folder, workspacePackage } = options;
  const { importName } = found;
  if (importName.startsWith(".") || isAbsolute(importName)) {
    const target = resolve(dirname(file), importName);
    return target.startsWith(folder + sep)
      ? undefined
      : `imports "${importName}", a file path outside its package`;
  }
  if (
    importName === workspacePackage.name ||
    importName.startsWith(`${workspacePackage.name}/`)
  ) {
    return undefined;
  }
  if (importName.startsWith("@yumekit/")) {
    const permission = (permittedImports[workspacePackage.row] ?? []).find(
      (candidate) => candidate.importName === importName,
    );
    if (permission === undefined) {
      return importName.split("/").length > 2
        ? `imports "${importName}", a file path inside another package`
        : `imports "${importName}", which the dependency table does not permit for ${workspacePackage.row}`;
    }
    return permission.typesOnly === true && !found.typesOnly
      ? `imports values from "${importName}", but the dependency table permits only types`
      : undefined;
  }
  const isSourceFile = relative(folder, file).startsWith(`src${sep}`);
  return browserPackages.has(workspacePackage.row) &&
    isSourceFile &&
    isNodeModule(importName)
    ? `imports the Node module "${importName}" into a browser package`
    : undefined;
}

export async function findImportViolations(
  root: string,
): Promise<ImportViolation[]> {
  const violations: ImportViolation[] = [];
  for (const workspacePackage of await workspacePackages(root)) {
    const folder = join(root, workspacePackage.folder);
    for (const file of await codeFilesOf(folder)) {
      const code = await readFile(file, "utf8");
      for (const found of importsOfFile({ fileName: file, code })) {
        const message = violationOf({ found, file, folder, workspacePackage });
        if (message !== undefined) {
          violations.push({
            file: relative(root, file),
            line: found.line,
            message,
          });
        }
      }
    }
  }
  return violations;
}
