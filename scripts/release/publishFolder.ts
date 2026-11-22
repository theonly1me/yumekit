import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  rootFiles,
  workspaceFolder,
  type PublishManifest,
} from "./publishManifest.ts";
import type { WorkspaceManifest } from "./workspaceManifests.ts";

const filesThatDoNotShip = /\.test\.|\.map$|\.tsbuildinfo$/;
const foldersThatDoNotShip = new Set(["testing"]);

export function isShippedPath(path: string): boolean {
  const name = basename(path);
  return !filesThatDoNotShip.test(name) && !foldersThatDoNotShip.has(name);
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function bundledFolderOf(name: string): string {
  return join(workspaceFolder, ...name.split("/"));
}

async function writeBundledPackage(options: {
  root: string;
  publishFolder: string;
  manifest: WorkspaceManifest;
  version: string;
}): Promise<void> {
  const { manifest } = options;
  const target = join(options.publishFolder, bundledFolderOf(manifest.name));
  await mkdir(target, { recursive: true });
  await writeFile(
    join(target, "package.json"),
    jsonText({
      name: manifest.name,
      version: options.version,
      type: manifest.type,
      exports: manifest.exports,
    }),
  );
  for (const entry of manifest.files) {
    await cp(join(options.root, manifest.folder, entry), join(target, entry), {
      recursive: true,
      filter: isShippedPath,
    });
  }
}

export async function writePublishFolder(options: {
  root: string;
  publishFolder: string;
  manifest: PublishManifest;
  bundled: WorkspaceManifest[];
}): Promise<void> {
  const { root, publishFolder, manifest } = options;
  await rm(publishFolder, { recursive: true, force: true });
  await mkdir(publishFolder, { recursive: true });
  await writeFile(join(publishFolder, "package.json"), jsonText(manifest));
  for (const file of rootFiles) {
    await copyFile(join(root, file), join(publishFolder, file));
  }
  for (const bundled of options.bundled) {
    await writeBundledPackage({
      root,
      publishFolder,
      manifest: bundled,
      version: manifest.version,
    });
  }
}
