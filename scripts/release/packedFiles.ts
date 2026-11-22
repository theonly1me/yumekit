import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { bundledFolderOf } from "./publishFolder.ts";
import { rootFiles } from "./publishManifest.ts";

const runFile = promisify(execFile);
const tarPrefix = "package/";
const installScripts = ["preinstall", "install", "postinstall", "prepare"];
const pathsThatDoNotShip = [
  { pattern: /\.test\./, reason: "a test file" },
  { pattern: /(?:^|\/)testing\//, reason: "a test helper" },
  { pattern: /\.map$/, reason: "a source map" },
  { pattern: /(?:^|\/)\.env/, reason: "an .env file" },
  { pattern: /(?:^|\/)src\//, reason: "repository source" },
  { pattern: /(?<!\.d)\.tsx?$/, reason: "TypeScript source" },
  { pattern: /(?:^|\/)(?:docs|prototype)\//, reason: "a design file" },
  { pattern: /\.(?:pem|key|npmrc)$|keys\.json$/, reason: "a key file" },
  { pattern: /binding\.gyp$/, reason: "a native build file" },
];
const keyPatterns = [
  /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /npm_[A-Za-z0-9]{36}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

export async function listPackedFiles(packedFile: string): Promise<string[]> {
  const { stdout } = await runFile("tar", ["-tzf", packedFile], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout
    .split("\n")
    .filter((line) => line !== "" && !line.endsWith("/"))
    .sort();
}

function permittedRootsOf(bundledNames: string[]): string[] {
  return [
    ...["package.json", ...rootFiles].map((file) => `${tarPrefix}${file}`),
    ...bundledNames.map((name) => `${tarPrefix}${bundledFolderOf(name)}/`),
  ];
}

export function pathProblemsOf(options: {
  paths: string[];
  bundledNames: string[];
}): string[] {
  const roots = permittedRootsOf(options.bundledNames);
  const problems: string[] = [];
  for (const path of options.paths) {
    if (
      !roots.some(
        (root) =>
          path === root || (root.endsWith("/") && path.startsWith(root)),
      )
    ) {
      problems.push(`${path} is outside the files list.`);
    }
    for (const rule of pathsThatDoNotShip) {
      if (rule.pattern.test(path)) problems.push(`${path} is ${rule.reason}.`);
    }
  }
  return problems;
}

export function contentProblemsOf(options: {
  path: string;
  text: string;
}): string[] {
  const problems = keyPatterns
    .filter((pattern) => pattern.test(options.text))
    .map(() => `${options.path} holds a value in the form of a key.`);
  if (options.path.endsWith("package.json")) {
    const manifest: unknown = JSON.parse(options.text);
    const scripts =
      typeof manifest === "object" && manifest !== null && "scripts" in manifest
        ? manifest.scripts
        : undefined;
    const found = installScripts.filter(
      (name) =>
        typeof scripts === "object" && scripts !== null && name in scripts,
    );
    problems.push(
      ...found.map((name) => `${options.path} has the script ${name}.`),
    );
  }
  return problems;
}

export async function packedFileProblemsOf(options: {
  paths: string[];
  bundledNames: string[];
  publishFolder: string;
}): Promise<string[]> {
  const problems = pathProblemsOf(options);
  for (const path of options.paths) {
    const text = await readFile(
      join(options.publishFolder, path.slice(tarPrefix.length)),
      "utf8",
    );
    problems.push(...contentProblemsOf({ path, text }));
  }
  return problems;
}

export function layoutOf(paths: string[]): string[] {
  const counts = new Map<string, number>();
  for (const path of paths) {
    const parts = path.slice(tarPrefix.length).split("/");
    const depth = parts[0] === "lib" ? 5 : 1;
    const group = parts.slice(0, Math.min(depth, parts.length)).join("/");
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return [...counts.entries()].map(
    ([group, count]) => `${String(count).padStart(5)}  ${group}`,
  );
}
