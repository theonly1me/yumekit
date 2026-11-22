import { copyFile, link, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  inCatalogOrder,
  type PlatformId,
  type ProjectSnapshot,
} from "@yumekit/project";

export interface PlatformFile {
  platformId: PlatformId | undefined;
  file: string;
}

const longestFileName = 64;

export function fileNameOfProject(name: string): string {
  const safe = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .slice(0, longestFileName)
    .replace(/^-+|-+$/g, "");
  return safe === "" ? "video" : safe;
}

export function platformFilesOf(options: {
  snapshot: ProjectSnapshot;
  outputId: string;
  rendersFolder: string;
}): [PlatformFile, ...PlatformFile[]] {
  const { snapshot, outputId, rendersFolder } = options;
  const output = snapshot.project.outputs.find(
    (candidate) => candidate.id === outputId,
  );
  const [first, ...others] = inCatalogOrder(output?.platforms ?? []);
  if (first === undefined) {
    return [
      { platformId: undefined, file: join(rendersFolder, `${outputId}.mp4`) },
    ];
  }
  const projectFileName = fileNameOfProject(snapshot.project.name);
  const fileOf = (platformId: PlatformId): PlatformFile => ({
    platformId,
    file: join(rendersFolder, `${projectFileName}-${platformId}.mp4`),
  });
  return [fileOf(first), ...others.map(fileOf)];
}

export async function linkOrCopy(options: {
  from: string;
  to: string;
}): Promise<void> {
  await rm(options.to, { force: true });
  try {
    await link(options.from, options.to);
  } catch {
    await copyFile(options.from, options.to);
  }
}
