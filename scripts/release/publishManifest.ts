import type { WorkspaceManifest } from "./workspaceManifests.ts";

export type Outcome<Value> =
  { ok: true; value: Value } | { ok: false; problems: string[] };

export interface PublishManifest {
  name: "yumekit";
  version: string;
  description: string;
  license: string;
  type: "module";
  engines: Record<string, string>;
  repository: { type: "git"; url: string };
  homepage: string;
  bin: { yumekit: string };
  files: string[];
  dependencies: Record<string, string>;
}

export interface RootFields {
  version: string;
  description: string;
  license: string;
  engines: Record<string, string>;
}

const workspaceScope = "@yumekit/";
export const workspaceFolder = "lib/node_modules";
export const rootFiles = ["README.md", "LICENSE"];
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function isWorkspaceName(name: string): boolean {
  return name.startsWith(workspaceScope);
}

export function bundledPackagesOf(options: {
  manifests: WorkspaceManifest[];
  entryNames: string[];
}): Outcome<WorkspaceManifest[]> {
  const byName = new Map(options.manifests.map((entry) => [entry.name, entry]));
  const bundled = new Map<string, WorkspaceManifest>();
  const problems: string[] = [];
  const pending = [...options.entryNames];
  for (let name = pending.pop(); name !== undefined; name = pending.pop()) {
    if (bundled.has(name)) continue;
    const manifest = byName.get(name);
    if (manifest === undefined) {
      problems.push(`No workspace package has the name ${name}.`);
      continue;
    }
    bundled.set(name, manifest);
    pending.push(...Object.keys(manifest.dependencies).filter(isWorkspaceName));
  }
  return problems.length > 0
    ? { ok: false, problems }
    : { ok: true, value: [...bundled.values()] };
}

export function outsideDependenciesOf(
  packages: WorkspaceManifest[],
): Outcome<Record<string, string>> {
  const versions: Record<string, string> = {};
  const usedBy: Record<string, string> = {};
  const problems: string[] = [];
  for (const manifest of packages) {
    for (const [name, version] of Object.entries(manifest.dependencies)) {
      if (isWorkspaceName(name)) continue;
      const known = versions[name];
      if (!exactVersion.test(version)) {
        problems.push(
          `${manifest.folder} needs ${name} ${version}, which is not an exact version.`,
        );
      } else if (known === undefined) {
        versions[name] = version;
        usedBy[name] = manifest.folder;
      } else if (known !== version) {
        problems.push(
          `${manifest.folder} needs ${name} ${version}, but ${usedBy[name] ?? ""} needs ${known}.`,
        );
      }
    }
  }
  for (const manifest of packages) {
    for (const name of Object.keys(manifest.peerDependencies)) {
      if (!isWorkspaceName(name) && versions[name] === undefined) {
        problems.push(
          `${manifest.folder} has the peer ${name}, which no bundled package depends on.`,
        );
      }
    }
  }
  return problems.length > 0
    ? { ok: false, problems }
    : { ok: true, value: sortedRecord(versions) };
}

function sortedRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((name) => [name, record[name] ?? ""]),
  );
}

export function publishManifestOf(options: {
  root: RootFields;
  codePackages: WorkspaceManifest[];
}): Outcome<PublishManifest> {
  const outside = outsideDependenciesOf(options.codePackages);
  if (!outside.ok) return outside;
  return {
    ok: true,
    value: {
      name: "yumekit",
      version: options.root.version,
      description: options.root.description,
      license: options.root.license,
      type: "module",
      engines: options.root.engines,
      repository: {
        type: "git",
        url: "git+https://github.com/theonly1me/yumekit.git",
      },
      homepage: "https://github.com/theonly1me/yumekit#readme",
      bin: { yumekit: `${workspaceFolder}/@yumekit/cli/dist/main.js` },
      files: ["lib", ...rootFiles],
      dependencies: outside.value,
    },
  };
}
