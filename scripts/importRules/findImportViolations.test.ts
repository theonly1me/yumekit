import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findImportViolations } from "./findImportViolations.ts";

async function workspaceWith(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-imports-"));
  const packages = [
    "packages/scene",
    "packages/stage",
    "packages/render",
    "packages/harness-mcp",
    "apps/cli",
    "tools/sample-media",
  ];
  for (const folder of packages) {
    await mkdir(join(root, folder), { recursive: true });
    const name = folder.startsWith("packages/")
      ? `@yumekit/${folder.slice(9)}`
      : `@yumekit/${folder.split("/")[1] ?? ""}`;
    await writeFile(
      join(root, folder, "package.json"),
      JSON.stringify({ name }),
    );
  }
  for (const [file, code] of Object.entries(files)) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), code);
  }
  return root;
}

async function messagesOf(files: Record<string, string>): Promise<string[]> {
  const violations = await findImportViolations(await workspaceWith(files));
  return violations.map(
    (violation) =>
      `${violation.file}:${String(violation.line)} ${violation.message}`,
  );
}

describe("findImportViolations", () => {
  it("finds an import of a package that the table does not permit", async () => {
    await expect(
      messagesOf({
        "packages/stage/src/a.ts":
          'import { renderFrame } from "@yumekit/render";\n',
      }),
    ).resolves.toEqual([
      'packages/stage/src/a.ts:1 imports "@yumekit/render", which the dependency table does not permit for stage',
    ]);
  });

  it("accepts the imports that the table permits", async () => {
    await expect(
      messagesOf({
        "packages/stage/src/a.ts":
          'import { tween } from "@yumekit/scene";\nimport type { SceneClip } from "@yumekit/project";\n',
        "packages/harness-mcp/src/b.ts":
          'import { kitSceneSchemas } from "@yumekit/scene-kit/schemas";\n',
        "apps/cli/src/c.ts":
          'export { createHarnessServer } from "@yumekit/harness-mcp";\n',
      }),
    ).resolves.toEqual([]);
  });

  it("finds a value import where the table permits only types", async () => {
    await expect(
      messagesOf({
        "packages/stage/src/a.ts":
          '\nimport { openProject } from "@yumekit/project";\n',
      }),
    ).resolves.toEqual([
      'packages/stage/src/a.ts:2 imports values from "@yumekit/project", but the dependency table permits only types',
    ]);
  });

  it("finds a file path inside another package, by name and by relative path", async () => {
    await expect(
      messagesOf({
        "packages/render/src/a.ts":
          'import "@yumekit/stage/dist/index.js";\nconst scene = await import("../../scene/src/index.js");\n',
      }),
    ).resolves.toEqual([
      'packages/render/src/a.ts:1 imports "@yumekit/stage/dist/index.js", a file path inside another package',
      'packages/render/src/a.ts:2 imports "../../scene/src/index.js", a file path outside its package',
    ]);
  });

  it("finds a Node module in the source of a browser package only", async () => {
    await expect(
      messagesOf({
        "packages/scene/src/a.ts":
          'import { readFile } from "node:fs/promises";\nimport path from "path";\n',
        "packages/scene/vitest.config.ts":
          'import { join } from "node:path";\n',
        "packages/render/src/b.ts": 'import { join } from "node:path";\n',
      }),
    ).resolves.toEqual([
      'packages/scene/src/a.ts:1 imports the Node module "node:fs/promises" into a browser package',
      'packages/scene/src/a.ts:2 imports the Node module "path" into a browser package',
    ]);
  });

  it("finds no violation in this repository", async () => {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    await expect(findImportViolations(root)).resolves.toEqual([]);
  });
});
