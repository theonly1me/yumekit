import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import {
  missingKeyMessage,
  plainFailureText,
  sendToSand,
  withoutKey,
  type SendRequest,
} from "../sandApi.ts";
import {
  errorResult,
  successResult,
  writeOutputFile,
  type Outcome,
} from "../toolResults.ts";
import { readMp4Facts } from "./mp4Facts.ts";
import { requestBody } from "./requestBody.ts";
import { runTask, type Wait } from "./runTask.ts";
import { checkVideoInput, videoInput, type VideoPlan } from "./videoInput.ts";
import { videoModel } from "./videoModel.ts";

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

const description = `Make an MP4 clip with ${videoModel.label} of Sand AI, from a prompt, a first frame and an optional last frame, or reference pictures. The clip has sound unless with_audio is false. Uses the Sand AI API key of the user. Each second costs money: about ${String(videoModel.usdPerSecond)} US dollars at ${videoModel.resolution} on ${videoModel.readOn}. A call can take minutes. cost_usd is an estimate from the price list.`;

function progressReporter(extra: ToolExtra) {
  const progressToken = extra._meta?.progressToken;
  return async (progress: { poll: number; status: string }) => {
    if (progressToken === undefined) return;
    await extra.sendNotification({
      method: "notifications/progress",
      params: {
        progressToken,
        progress: progress.poll,
        message: `Sand AI status: ${progress.status}`,
      },
    });
  };
}

async function downloadClip(options: {
  sendRequest: SendRequest;
  url: string;
  taskId: string;
}): Promise<Outcome<Buffer, string>> {
  const sent = await sendToSand({
    sendRequest: options.sendRequest,
    request: new Request(options.url),
  });
  if (!sent.ok) {
    return {
      ok: false,
      failure: `Cannot download the clip of the Sand AI task ${options.taskId}: ${sent.failure.message}`,
    };
  }
  return { ok: true, value: Buffer.from(await sent.value.arrayBuffer()) };
}

function clipResult(options: {
  path: string;
  bytes: Buffer;
  plan: VideoPlan;
}): CallToolResult {
  const facts = readMp4Facts(options.bytes);
  const seconds = facts.durationSeconds ?? options.plan.durationSeconds;
  return successResult({
    files: [
      {
        path: options.path,
        kind: "video",
        duration_seconds: seconds,
        ...(facts.widthPixels === undefined
          ? {}
          : { width_pixels: facts.widthPixels }),
        ...(facts.heightPixels === undefined
          ? {}
          : { height_pixels: facts.heightPixels }),
      },
    ],
    cost_usd: Math.round(videoModel.usdPerSecond * seconds * 10_000) / 10_000,
    cost_is_estimate: true,
  });
}

export function registerVideoTool(options: {
  server: McpServer;
  apiKey: string | undefined;
  sendRequest: SendRequest;
  wait: Wait;
}): void {
  options.server.registerTool(
    "generate_video",
    { description, inputSchema: videoInput },
    async (...parameters) => {
      const [input, extra] = parameters;
      const { apiKey, sendRequest } = options;
      if (!apiKey) return errorResult({ message: missingKeyMessage });
      const plan = checkVideoInput(input);
      if (!plan.ok) return errorResult({ message: plan.failure });
      const body = await requestBody(plan.value);
      if (!body.ok) return errorResult({ message: body.failure });
      const finished = await runTask({
        body: body.value,
        connection: {
          sendRequest,
          apiKey,
          wait: options.wait,
          reportProgress: progressReporter(extra),
        },
      });
      if (!finished.ok) {
        return errorResult({
          message: withoutKey({
            message: plainFailureText(finished.failure),
            apiKey,
          }),
          isServiceQuota: finished.failure.kind === "rate-limit",
        });
      }
      const clip = await downloadClip({
        sendRequest,
        url: finished.value.videoUrl,
        taskId: finished.value.id,
      });
      if (!clip.ok) return errorResult({ message: clip.failure });
      const written = await writeOutputFile({
        outputDirectory: plan.value.outputDirectory,
        fileName: `${plan.value.fileStem}.mp4`,
        bytes: clip.value,
      });
      if (!written.ok) return errorResult({ message: written.failure });
      return clipResult({
        path: written.value,
        bytes: clip.value,
        plan: plan.value,
      });
    },
  );
}
