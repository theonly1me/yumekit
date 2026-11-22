import { execFile } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  layoutOf,
  listPackedFiles,
  packedFileProblemsOf,
} from "./packedFiles.ts";
import { writePublishFolder } from "./publishFolder.ts";
import { bundledPackagesOf, publishManifestOf } from "./publishManifest.ts";
import {
  readJson,
  readWorkspaceManifests,
  rootFieldsOf,
} from "./workspaceManifests.ts";

const runFile = promisify(execFile);
const root = fileURLToPath(new URL("../..", import.meta.url));
const releaseFolder = join(root, "release");
const publishFolder = join(releaseFolder, "package");

function stop(problems: string[]): never {
  for (const problem of problems) console.error(problem);
  console.error(
    `pack-release stopped with ${String(problems.length)} problems.`,
  );
  process.exit(1);
}

const manifests = await readWorkspaceManifests(root);
const codePackages = bundledPackagesOf({
  manifests,
  entryNames: ["@yumekit/cli"],
});
if (!codePackages.ok) stop(codePackages.problems);
const assetPackages = bundledPackagesOf({
  manifests,
  entryNames: ["@yumekit/editor"],
});
if (!assetPackages.ok) stop(assetPackages.problems);
const manifest = publishManifestOf({
  root: rootFieldsOf(await readJson(join(root, "package.json"))),
  codePackages: codePackages.value,
});
const bundled = [...codePackages.value, ...assetPackages.value];
if (!manifest.ok) stop(manifest.problems);

await rm(releaseFolder, { recursive: true, force: true });
await mkdir(releaseFolder, { recursive: true });
await writePublishFolder({
  root,
  publishFolder,
  manifest: manifest.value,
  bundled,
});
await runFile("npm", ["pack", "--pack-destination", releaseFolder], {
  cwd: publishFolder,
});
const packedFile = join(releaseFolder, `yumekit-${manifest.value.version}.tgz`);
const paths = await listPackedFiles(packedFile);
const problems = await packedFileProblemsOf({
  paths,
  bundledNames: bundled.map((entry) => entry.name),
  publishFolder,
});
await writeFile(join(releaseFolder, "files.txt"), `${paths.join("\n")}\n`);
console.log(layoutOf(paths).join("\n"));
console.log(
  `Dependencies: ${JSON.stringify(manifest.value.dependencies, null, 2)}`,
);
console.log(`File: ${packedFile}`);
console.log(`Size: ${String((await stat(packedFile)).size)} bytes`);
console.log(
  `Files: ${String(paths.length)}, listed in ${join(releaseFolder, "files.txt")}`,
);
if (problems.length > 0) stop(problems);
