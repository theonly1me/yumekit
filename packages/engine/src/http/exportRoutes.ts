import { z } from "zod";
import { exportsFolderOf } from "../exports/exportFiles.js";
import { revealCommandOf, revealFile } from "../exports/revealFile.js";
import { revealTargetOf } from "../exports/revealTarget.js";
import { fileInside } from "../files/fileInside.js";
import { sendFile } from "../files/sendFile.js";
import { isAgentCall } from "./chatRoutes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { notFound, sendJson, type Failure } from "./responses.js";

const startBodySchema = z.strictObject({
  output_ids: z.array(z.string().min(1).max(64)).min(1).max(20),
  scale: z.union([z.literal(1), z.literal(0.5), z.literal(0.25)]).default(1),
  largest_megabytes: z.number().positive().max(10_000).optional(),
  short_side_pixels: z.number().int().min(144).optional(),
});

const revealBodySchema = z.strictObject({ path: z.string().min(1).max(4096) });

const notForTheAi: Failure = {
  status: 403,
  kind: "export-not-for-the-ai",
  message: "Only the person exports the film and opens its folder.",
};

async function startExport(exchange: Exchange): Promise<Failure | undefined> {
  if (isAgentCall(exchange)) return notForTheAi;
  const body = await readJsonBody({
    request: exchange.request,
    schema: startBodySchema,
  });
  if (!body.ok) return body.failure;
  const started = exchange.context.chat.exports.start({
    by: "person",
    outputIds: body.value.output_ids,
    scale: body.value.scale,
    largestMegabytes: body.value.largest_megabytes,
    shortSidePixels: body.value.short_side_pixels,
  });
  if (!started.ok) return { status: 409, ...started.failure };
  sendJson({
    response: exchange.response,
    status: 202,
    body: started.value,
  });
  return undefined;
}

async function revealExport(exchange: Exchange): Promise<Failure | undefined> {
  if (isAgentCall(exchange)) return notForTheAi;
  const body = await readJsonBody({
    request: exchange.request,
    schema: revealBodySchema,
  });
  if (!body.ok) return body.failure;
  const target = await revealTargetOf({
    projectFolder: exchange.context.projectFolder,
    path: body.value.path,
  });
  if (target.kind === "missing") {
    return notFound("The file is not there any more.");
  }
  if (target.kind === "outside") {
    return {
      status: 403,
      kind: "file-outside-project",
      message: "yumekit shows only files inside the project folder.",
    };
  }
  const { file } = target;
  const revealed = await revealFile(
    revealCommandOf({ platform: process.platform, file }),
  );
  if (!revealed.ok) return { status: 502, ...revealed.failure };
  sendJson({ response: exchange.response, status: 200, body: { file } });
  return undefined;
}

async function sendExportFile(
  exchange: Exchange,
): Promise<Failure | undefined> {
  const file = await fileInside({
    folder: exportsFolderOf(exchange.context.projectFolder),
    segments: exchange.parameters,
  });
  if (file === undefined) return notFound("The project has no such export.");
  await sendFile({
    request: exchange.request,
    response: exchange.response,
    file,
    contentSecurityPolicy: "default-src 'none'; sandbox",
  });
  return undefined;
}

export const exportRoutes: Route[] = [
  { method: "POST", pattern: ["api", "exports"], handle: startExport },
  {
    method: "POST",
    pattern: ["api", "exports", "reveal"],
    handle: revealExport,
  },
  {
    method: "GET",
    pattern: ["api", "exports", anySegment],
    handle: sendExportFile,
  },
];
