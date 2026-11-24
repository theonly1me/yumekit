import type { StagePage } from "../browser/openStagePage.js";
import type { Outcome } from "../outcome.js";
import type { PictureSize } from "../png.js";
import type { FrameRange } from "../project/frameRange.js";
import type { LoadedOutput } from "../project/loadOutput.js";
import type { RenderFailure } from "../renderFailure.js";
import { join } from "node:path";
import { monoFilesOf } from "../video/audioChannels.js";
import { audioMixOf } from "../video/audioMix.js";
import { leveledMix, measureMix } from "../video/loudness.js";
import { startEncoder } from "../video/encodeFrames.js";
import { ffmpegArgumentsOf } from "../video/ffmpegArguments.js";
import { drawFrame } from "./drawFrame.js";

export async function encodeRange(options: {
  stagePage: StagePage;
  loaded: LoadedOutput;
  range: FrameRange;
  destination: string;
  videoSize: PictureSize;
  onProgress:
    | ((progress: { framesDone: number; frameCount: number }) => void)
    | undefined;
}): Promise<Outcome<{ finished: true }, RenderFailure>> {
  const { stagePage, loaded, range } = options;
  const framesPerSecond = loaded.snapshot.project.framesPerSecond;
  const audioAssetIds = new Set(
    loaded.timeline.tracks.flatMap((track) =>
      track.kind === "audio" ? track.clips.map((clip) => clip.assetId) : [],
    ),
  );
  const monoFiles = await monoFilesOf(
    loaded.snapshot.assets
      .filter((asset) => audioAssetIds.has(asset.id))
      .map((asset) => join(loaded.folder, asset.file)),
  );
  const mixOf = (mixOptions: { range: FrameRange; firstInputIndex: number }) =>
    audioMixOf({
      folder: loaded.folder,
      timeline: loaded.timeline,
      assets: loaded.snapshot.assets,
      framesPerSecond,
      monoFiles,
      ...mixOptions,
    });
  const mix = mixOf({ range, firstInputIndex: 1 });
  const wholeMix = mixOf({
    range: { firstFrame: 0, frameCount: loaded.frameCount },
    firstInputIndex: 0,
  });
  const encoder = startEncoder(
    ffmpegArgumentsOf({
      framesPerSecond,
      destination: options.destination,
      videoSize: options.videoSize,
      audioMix:
        mix === undefined
          ? undefined
          : leveledMix({
              mix,
              loudness:
                wholeMix === undefined ? undefined : await measureMix(wholeMix),
            }),
    }),
  );
  try {
    for (let framesDone = 0; framesDone < range.frameCount; framesDone += 1) {
      const drawn = await drawFrame({
        stagePage,
        frame: range.firstFrame + framesDone,
        use: "video",
      });
      if (!drawn.ok) {
        encoder.stop();
        return drawn;
      }
      await encoder.write(drawn.value);
      options.onProgress?.({
        framesDone: framesDone + 1,
        frameCount: range.frameCount,
      });
    }
  } catch (error) {
    encoder.stop();
    throw error;
  }
  return encoder.finish();
}
