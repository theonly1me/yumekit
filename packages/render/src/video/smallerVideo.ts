import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bytesInMegabyte,
  shortSideOf,
  sizeAtShortSide,
  smallerFileAudioKilobits,
  smallerFilePlanOf,
  smallerFileShare,
} from "@yumekit/project";
import { probeMedia } from "../media/probeMedia.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { PictureSize } from "../png.js";
import type { RenderFailure } from "../renderFailure.js";
import { encodeSmallerFile } from "./smallerFile.js";

export interface SmallerFileChoice {
  largestMegabytes: number;
  shortSidePixels?: number;
}

interface RenderedBest extends PictureSize {
  file: string;
  durationSeconds: number;
}

function megabytesText(megabytes: number): string {
  return `${String(Math.ceil(megabytes * 10) / 10)} MB`;
}

function notReached(options: {
  choice: SmallerFileChoice;
  smallestMegabytes: number;
}): { ok: false; failure: RenderFailure } {
  const { choice, smallestMegabytes } = options;
  return fail({
    kind: "file-size-not-reached",
    largestMegabytes: choice.largestMegabytes,
    smallestMegabytes,
    message: `This video does not fit under ${megabytesText(choice.largestMegabytes)}. The smallest file that yumekit can make is about ${megabytesText(smallestMegabytes)}.`,
    hint: "Pick a larger size, a smaller picture, or a shorter part.",
  });
}

async function encodeUnder(options: {
  best: RenderedBest;
  destination: string;
  workFolder: string;
  choice: SmallerFileChoice;
}): Promise<Outcome<PictureSize, RenderFailure>> {
  const { best, choice } = options;
  const probed = await probeMedia({ file: best.file });
  const shortSidePixels = Math.min(
    choice.shortSidePixels ?? shortSideOf(best),
    shortSideOf(best),
  );
  const plan = smallerFilePlanOf({
    largestMegabytes: choice.largestMegabytes,
    seconds: best.durationSeconds,
    shortSidePixels,
    hasAudio: probed.ok && probed.value.hasAudio === true,
  });
  if (plan.look === "too-small") {
    return notReached({ choice, smallestMegabytes: plan.smallestMegabytes });
  }
  const pictureSize = sizeAtShortSide({ size: best, shortSidePixels });
  const largestBytes = choice.largestMegabytes * bytesInMegabyte;
  let videoKilobits = plan.videoKilobits;
  let bytes = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 2 && bytes > largestBytes; attempt += 1) {
    const encoded = await encodeSmallerFile({
      source: best.file,
      destination: options.destination,
      workFolder: options.workFolder,
      videoKilobitsPerSecond: videoKilobits,
      audioKilobitsPerSecond: smallerFileAudioKilobits,
      pictureSize,
    });
    if (!encoded.ok) return encoded;
    bytes = encoded.value.bytes;
    const overBits = (bytes - largestBytes * smallerFileShare) * 8;
    videoKilobits = Math.floor(
      videoKilobits - overBits / best.durationSeconds / 1000,
    );
    if (videoKilobits <= 0) break;
  }
  if (bytes > largestBytes) {
    await rm(options.destination, { force: true });
    return notReached({ choice, smallestMegabytes: bytes / bytesInMegabyte });
  }
  return succeed(pictureSize);
}

export async function renderSmallerVideo<
  Rendered extends RenderedBest,
>(options: {
  destination: string;
  choice: SmallerFileChoice;
  renderBest: (
    destination: string,
  ) => Promise<Outcome<Rendered, RenderFailure>>;
}): Promise<Outcome<Rendered, RenderFailure>> {
  const workFolder = await mkdtemp(join(tmpdir(), "yumekit-smaller-"));
  try {
    const best = await options.renderBest(join(workFolder, "best.mp4"));
    if (!best.ok) return best;
    const encoded = await encodeUnder({
      best: best.value,
      destination: options.destination,
      workFolder,
      choice: options.choice,
    });
    if (!encoded.ok) return encoded;
    return succeed({
      ...best.value,
      ...encoded.value,
      file: options.destination,
    });
  } finally {
    await rm(workFolder, { recursive: true, force: true });
  }
}
