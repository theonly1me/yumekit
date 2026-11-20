import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectFiles } from "./projectFiles.js";
import { writeFileAtomic } from "./writeFileAtomic.js";

const mediaFolder = "assets/files/";

function sceneFolderOf(file: string): string | undefined {
  const [root, sceneId] = file.split("/");
  return root === "scenes" && sceneId !== undefined
    ? `scenes/${sceneId}`
    : undefined;
}

export async function syncFiles(options: {
  folder: string;
  previous: ProjectFiles;
  next: ProjectFiles;
}): Promise<void> {
  const { folder, previous, next } = options;
  for (const [file, content] of next) {
    if (previous.get(file) !== content) {
      await writeFileAtomic({ path: join(folder, file), content });
    }
  }
  const removedFiles = [...previous.keys()].filter(
    (file) => !next.has(file) && !file.startsWith(mediaFolder),
  );
  for (const file of removedFiles) {
    await rm(join(folder, file), { force: true });
  }
  const liveSceneFolders = new Set(
    [...next.keys()]
      .map(sceneFolderOf)
      .filter((sceneFolder) => sceneFolder !== undefined),
  );
  const removedSceneFolders = new Set(
    removedFiles
      .map(sceneFolderOf)
      .filter(
        (sceneFolder) =>
          sceneFolder !== undefined && !liveSceneFolders.has(sceneFolder),
      ),
  );
  for (const sceneFolder of removedSceneFolders) {
    if (sceneFolder !== undefined) {
      await rm(join(folder, sceneFolder), { recursive: true, force: true });
    }
  }
}
