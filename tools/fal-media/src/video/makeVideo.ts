import { z } from "zod";
import { requestBytes } from "../falApi.ts";
import { runQueueRequest } from "../queue/runQueueRequest.ts";
import {
  writeOutputFile,
  type Outcome,
  type MediaToolResult,
} from "../toolResults.ts";
import { endpointCall, type MakeVideoOptions } from "./endpointCall.ts";
import { readMp4Facts } from "./mp4Facts.ts";
import { videoCostFields } from "./videoCost.ts";

const videoOutput = z.object({ video: z.object({ url: z.url() }) });

export async function makeVideo(
  options: MakeVideoOptions,
): Promise<Outcome<MediaToolResult, string>> {
  const call = await endpointCall(options);
  if (!call.ok) return call;
  const output = await runQueueRequest({
    ...options,
    ...call.value,
    output: videoOutput,
  });
  if (!output.ok) return { ok: false, failure: output.failure.message };
  const videoUrl = output.value.video.url;
  const video = await requestBytes({
    sendRequest: options.sendRequest,
    request: new Request(videoUrl),
  });
  if (!video.ok) {
    return {
      ok: false,
      failure: `Cannot download the video from ${videoUrl}: ${video.failure.message}`,
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
      ...videoCostFields({ input: options.input, durationSeconds }),
    },
  };
}
