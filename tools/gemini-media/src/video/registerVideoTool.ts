import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { missingKeyMessage, type SendRequest } from "../geminiApi.ts";
import {
  errorResult,
  successResult,
  writeOutputFile,
  type VideoFile,
} from "../toolResults.ts";
import {
  fileExtensionOf,
  outputTokensOf,
} from "../interactions/interaction.ts";
import { progressReporter } from "../interactions/progressReporter.ts";
import { requestOutput, type Wait } from "../interactions/requestOutput.ts";
import { readMp4Facts } from "./mp4Facts.ts";
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
      const video = await requestOutput({
        body: body.value,
        output: { type: "video", defaultMimeType: "video/mp4" },
        connection: {
          sendRequest: options.sendRequest,
          apiKey: options.apiKey,
          wait: options.wait,
          reportProgress: progressReporter(extra),
        },
      });
      if (!video.ok) return errorResult(video.failure);
      const written = await writeOutputFile({
        outputDirectory: input.output_directory,
        fileStem: plan.value.fileStem,
        extension: fileExtensionOf({
          mimeType: video.value.mimeType,
          fallback: "mp4",
        }),
        bytes: video.value.bytes,
      });
      if (!written.ok) return errorResult(written.failure);
      const videoTokens = outputTokensOf({
        interaction: video.value.interaction,
        modality: "video",
      });
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
