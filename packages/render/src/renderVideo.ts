import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fail, succeed, type Outcome } from "./outcome.js";
import { frameRangeOf } from "./project/frameRange.js";
import { loadOutput, type LoadedOutput } from "./project/loadOutput.js";
import type { RenderFailure, RenderScale } from "./renderFailure.js";
import { checkRepeatable } from "./session/checkRepeatable.js";
import { encodeRange } from "./session/encodeRange.js";
import { withStagePage } from "./session/withStagePage.js";
import { findFfmpeg } from "./video/findFfmpeg.js";

export interface RenderedVideo {
  file: string;
  frameCount: number;
  durationSeconds: number;
}

export interface RenderVideoOptions {
  folder: string;
  outputId: string;
  destination: string;
  firstFrame?: number;
  frameCount?: number;
  scale?: RenderScale;
  onProgress?: (progress: { framesDone: number; frameCount: number }) => void;
}

async function renderLoadedVideo(options: {
  loaded: LoadedOutput;
  request: RenderVideoOptions;
}): Promise<Outcome<RenderedVideo, RenderFailure>> {
  const { loaded, request } = options;
  const range = frameRangeOf({
    firstFrame: request.firstFrame,
    frameCount: request.frameCount,
    outputFrameCount: loaded.frameCount,
  });
  if ("kind" in range) {
    return fail(range);
  }
  const ffmpegFailure = await findFfmpeg();
  if (ffmpegFailure !== undefined) {
    return fail(ffmpegFailure);
  }
  const destination = resolve(request.destination);
  await mkdir(dirname(destination), { recursive: true });
  return withStagePage({
    loaded,
    scale: request.scale ?? 1,
    use: async (stagePage) => {
      const repeatable = await checkRepeatable({
        stagePage,
        range,
        timeline: loaded.timeline,
      });
      if (!repeatable.ok) {
        return repeatable;
      }
      const encoded = await encodeRange({
        stagePage,
        loaded,
        range,
        destination,
        onProgress: request.onProgress,
      });
      return encoded.ok
        ? succeed({
            file: destination,
            frameCount: range.frameCount,
            durationSeconds:
              range.frameCount / loaded.snapshot.project.framesPerSecond,
          })
        : encoded;
    },
  });
}

export async function renderVideo(
  options: RenderVideoOptions,
): Promise<Outcome<RenderedVideo, RenderFailure>> {
  const loaded = await loadOutput(options);
  return loaded.ok
    ? renderLoadedVideo({ loaded: loaded.value, request: options })
    : loaded;
}
