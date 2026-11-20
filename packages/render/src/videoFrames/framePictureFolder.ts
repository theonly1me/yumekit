import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Asset } from "@yumekit/project";
import { z } from "zod";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { convertVideo } from "./convertVideo.js";

export interface FramePictureFolder {
  folder: string;
  pictureCount: number;
}

const completeSchema = z.object({ pictureCount: z.int().min(1) });

export const completeFileName = "complete.json";

export function framePictureFolderOf(options: {
  projectFolder: string;
  asset: Asset;
  framesPerSecond: number;
}): string {
  const portableHash = options.asset.contentHash.replace(/[^a-z0-9-]/g, "-");
  return join(
    options.projectFolder,
    ".cache",
    "video-frames",
    `${portableHash}-${String(options.framesPerSecond)}`,
  );
}

async function readPictureCount(folder: string): Promise<number | undefined> {
  try {
    const text = await readFile(join(folder, completeFileName), "utf8");
    const parsed = completeSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.pictureCount : undefined;
  } catch {
    return undefined;
  }
}

async function moveIntoPlace(options: {
  workFolder: string;
  folder: string;
}): Promise<void> {
  await rm(options.folder, { recursive: true, force: true });
  try {
    await rename(options.workFolder, options.folder);
  } catch (error) {
    await rm(options.workFolder, { recursive: true, force: true });
    if ((await readPictureCount(options.folder)) === undefined) {
      throw error;
    }
  }
}

export async function prepareFramePictures(options: {
  projectFolder: string;
  asset: Asset;
  framesPerSecond: number;
}): Promise<Outcome<FramePictureFolder, RenderFailure>> {
  const folder = framePictureFolderOf(options);
  const cachedCount = await readPictureCount(folder);
  if (cachedCount !== undefined) {
    return succeed({ folder, pictureCount: cachedCount });
  }
  const workFolder = `${folder}.making-${randomUUID()}`;
  await mkdir(workFolder, { recursive: true });
  const converted = await convertVideo({
    file: join(options.projectFolder, options.asset.file),
    framesPerSecond: options.framesPerSecond,
    folder: workFolder,
  });
  if (!converted.ok) {
    await rm(workFolder, { recursive: true, force: true });
    return fail({
      kind: "video-frames-failed",
      assetId: options.asset.id,
      stderrTail: converted.stderrTail,
      message: `FFmpeg cannot make the frame pictures of the video asset "${options.asset.id}": ${converted.stderrTail}`,
      hint: "Check that the video file is complete and that FFmpeg can play it.",
    });
  }
  await writeFile(
    join(workFolder, completeFileName),
    `${JSON.stringify({ pictureCount: converted.pictureCount })}\n`,
  );
  await moveIntoPlace({ workFolder, folder });
  return succeed({ folder, pictureCount: converted.pictureCount });
}
