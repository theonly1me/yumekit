import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface WorkspaceManifest {
  folder: string;
  name: string;
  type: string | undefined;
  exports: unknown;
  files: string[];
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

const packageGroups = ["packages", "apps", "tools"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringRecordOf(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const strings: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") strings[key] = entry;
  }
  return strings;
}

function stringListOf(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string")
    : [];
}

export function manifestOf(options: {
  folder: string;
  json: unknown;
}): WorkspaceManifest {
  const { folder, json } = options;
  if (!isRecord(json) || typeof json["name"] !== "string") {
    throw new Error(`${folder}/package.json has no name`);
  }
  const files = stringListOf(json["files"]);
  return {
    folder,
    name: json["name"],
    type: typeof json["type"] === "string" ? json["type"] : undefined,
    exports: json["exports"],
    files: files.length === 0 ? ["dist"] : files,
    dependencies: stringRecordOf(json["dependencies"]),
    peerDependencies: stringRecordOf(json["peerDependencies"]),
  };
}

export async function readJson(path: string): Promise<unknown> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  return parsed;
}

export async function readWorkspaceManifests(
  root: string,
): Promise<WorkspaceManifest[]> {
  const manifests: WorkspaceManifest[] = [];
  for (const group of packageGroups) {
    const entries = await readdir(join(root, group), { withFileTypes: true });
    for (const entry of entries.filter((candidate) =>
      candidate.isDirectory(),
    )) {
      const folder = `${group}/${entry.name}`;
      const json = await readJson(join(root, folder, "package.json"));
      manifests.push(manifestOf({ folder, json }));
    }
  }
  return manifests;
}

export function rootFieldsOf(json: unknown): {
  version: string;
  description: string;
  license: string;
  engines: Record<string, string>;
} {
  if (
    !isRecord(json) ||
    typeof json["version"] !== "string" ||
    typeof json["description"] !== "string" ||
    typeof json["license"] !== "string"
  ) {
    throw new Error(
      "The root package.json needs version, description, and license",
    );
  }
  return {
    version: json["version"],
    description: json["description"],
    license: json["license"],
    engines: stringRecordOf(json["engines"]),
  };
}
