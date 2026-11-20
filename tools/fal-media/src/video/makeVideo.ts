import { estimatedCostUsd } from "../catalog/index.ts";
import { requestBytes } from "../falApi.ts";
import {
  writeOutputFile,
  type Outcome,
  type VideoToolResult,
} from "../toolResults.ts";
import { endpointCall, type MakeVideoOptions } from "./endpointCall.ts";
import { readMp4Facts } from "./mp4Facts.ts";
import { runQueueRequest } from "./runQueueRequest.ts";

export async function makeVideo(
  options: MakeVideoOptions,
): Promise<Outcome<VideoToolResult, string>> {
  const call = await endpointCall(options);
  if (!call.ok) return call;
  const videoUrl = await runQueueRequest({ ...options, ...call.value });
  if (!videoUrl.ok) return { ok: false, failure: videoUrl.failure.message };
  const video = await requestBytes({
    sendRequest: options.sendRequest,
    request: new Request(videoUrl.value),
  });
  if (!video.ok) {
    return {
      ok: false,
      failure: `Cannot download the video from ${videoUrl.value}: ${video.failure.message}`,
    };
  }
  const written = await writeOutputFile({
    outputDirectory: options.input.outputDirectory,
    fileName: `${options.input.fileStem}.mp4`,
    bytes: video.value,
  });
  if (!written.ok) return written;
  const facts = readMp4Facts(video.value);
  const durationSeconds =
    facts.durationSeconds ?? options.input.durationSeconds;
  return {
    ok: true,
    value: {
      files: [
        {
          path: written.value,
          kind: "video",
          duration_seconds: durationSeconds,
          ...(facts.widthPixels === undefined
            ? {}
            : { width_pixels: facts.widthPixels }),
          ...(facts.heightPixels === undefined
            ? {}
            : { height_pixels: facts.heightPixels }),
        },
      ],
      cost_usd: estimatedCostUsd({
        model: options.input.model,
        resolution: options.input.resolution,
        durationSeconds,
      }),
      cost_is_estimate: true,
    },
  };
}
