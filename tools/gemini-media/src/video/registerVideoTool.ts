import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { missingKeyMessage, type SendRequest } from "../geminiApi.ts";
import {
  errorResult,
  successResult,
  writeOutputFile,
  type VideoFile,
} from "../toolResults.ts";
import { fileExtensionOf } from "./interaction.ts";
import { readMp4Facts } from "./mp4Facts.ts";
import { requestVideo, type Wait } from "./requestVideo.ts";
import { usdPerMillionVideoTokens, videoCostUsd } from "./videoCost.ts";
import { checkVideoInput, videoInput } from "./videoInput.ts";
import { videoModel } from "./videoModel.ts";
import { videoRequestBody } from "./videoRequestBody.ts";

const description = `Make a video clip with sound with the Gemini model ${videoModel.id}, from a prompt, a first frame, or both. Uses the Gemini API key of the user. It costs money for each second: about ${String(videoModel.usdPerSecondAt720p)} US dollars at 720p and ${String(videoModel.usdPerSecondAt1080p)} at 1080p on ${videoModel.readOn}. A call can take minutes. cost_usd in the result is an estimate from the video tokens.`;

function videoFile(options: { path: string; bytes: Buffer }): VideoFile {
  const facts = readMp4Facts(options.bytes);
  return {
    path: options.path,
    kind: "video",
    ...(facts.widthPixels === undefined
      ? {}
      : { width_pixels: facts.widthPixels }),
    ...(facts.heightPixels === undefined
      ? {}
      : { height_pixels: facts.heightPixels }),
    ...(facts.durationSeconds === undefined
      ? {}
      : { duration_seconds: facts.durationSeconds }),
  };
}

export function registerVideoTool(options: {
  server: McpServer;
  apiKey: string | undefined;
  model: string;
  environment: NodeJS.ProcessEnv;
  sendRequest: SendRequest;
  wait: Wait;
}): void {
  options.server.registerTool(
    "generate_video",
    { description, inputSchema: videoInput },
    async (...parameters) => {
      const [input, extra] = parameters;
      if (!options.apiKey) return errorResult(missingKeyMessage);
      const price = usdPerMillionVideoTokens(options.environment);
      if (!price.ok) return errorResult(price.failure);
      const plan = checkVideoInput({ input, configuredModel: options.model });
      if (!plan.ok) return errorResult(plan.failure);
      const body = await videoRequestBody(plan.value);
      if (!body.ok) return errorResult(body.failure);
      const progressToken = extra._meta?.progressToken;
      const video = await requestVideo({
        body: body.value,
        connection: {
          sendRequest: options.sendRequest,
          apiKey: options.apiKey,
          wait: options.wait,
          reportProgress: async (poll) => {
            if (progressToken === undefined) return;
            await extra.sendNotification({
              method: "notifications/progress",
              params: {
                progressToken,
                progress: poll,
                message: `Waiting for the Gemini API, check ${String(poll)}`,
              },
            });
          },
        },
      });
      if (!video.ok) return errorResult(video.failure);
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: plan.value.fileStem,
        extension: fileExtensionOf(video.value.mimeType),
        bytes: video.value.bytes,
      });
      if (!written.ok) return errorResult(written.failure);
      const { videoTokens } = video.value;
      return successResult({
        files: [videoFile({ path: written.value, bytes: video.value.bytes })],
        ...(videoTokens === undefined
          ? {}
          : {
              cost_usd: videoCostUsd({
                videoTokens,
                usdPerMillionTokens: price.value,
              }),
              cost_is_estimate: true,
            }),
      });
    },
  );
}
