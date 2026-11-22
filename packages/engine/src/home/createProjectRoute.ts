import { mkdir, realpath } from "node:fs/promises";
import { dirname } from "node:path";
import {
  createProject,
  inCatalogOrder,
  lookIds,
  platformIds,
  videoStyles,
  type LookId,
  type PlatformId,
  type VideoStyle,
} from "@yumekit/project";
import { z } from "zod";
import type { Outcome } from "../engineTypes.js";
import type { Exchange } from "../http/exchange.js";
import { readJsonBody } from "../http/readJsonBody.js";
import { sendJson, type Failure } from "../http/responses.js";
import { firstRequestTextOf, sendFirstRequest } from "./firstRequest.js";
import type { HomeContext } from "./homeContext.js";
import { projectLengthSchema } from "./homeTypes.js";
import { outputsForPlatforms } from "./projectOutputs.js";
import {
  folderNameOf,
  freeProjectFolder,
  projectNameOf,
} from "./projectNames.js";
import { readProjectsFolder } from "./projectsFolder.js";
import { recordRecentProject } from "./recentProjects.js";

export const longestRequestCharacters = 4_000;

const createBodySchema = z.strictObject({
  request: z.string().trim().min(1).max(longestRequestCharacters),
  platform_ids: z.array(z.enum(platformIds)).min(1).max(platformIds.length),
  length: projectLengthSchema,
  video_style: z.enum(videoStyles).default("graphics"),
  look: z.enum(lookIds).default("midnight"),
});

function notCreated(message: string): Failure {
  return { status: 500, kind: "project-not-created", message };
}

async function makeProjectFolder(options: {
  request: string;
  platformIds: PlatformId[];
  videoStyle: VideoStyle;
  look: LookId;
}): Promise<Outcome<string, Failure>> {
  const projectsFolder = await readProjectsFolder();
  if (!projectsFolder.ok) {
    return { ok: false, failure: { status: 409, ...projectsFolder.failure } };
  }
  await mkdir(projectsFolder.value, { recursive: true });
  const parent = await realpath(projectsFolder.value);
  const folder = await freeProjectFolder({
    projectsFolder: parent,
    folderName: folderNameOf(options.request),
  });
  if (folder === undefined || dirname(folder) !== parent) {
    return { ok: false, failure: notCreated("No free folder name was found.") };
  }
  const created = await createProject({
    folder,
    name: projectNameOf(options.request),
    framesPerSecond: 30,
    outputs: outputsForPlatforms(options.platformIds),
    videoStyle: options.videoStyle,
    look: options.look,
  });
  return created.ok
    ? { ok: true, value: folder }
    : { ok: false, failure: notCreated(created.failure.message) };
}

function queued<Value>(options: {
  context: HomeContext;
  work: () => Promise<Value>;
}): Promise<Value> {
  const next = options.context.creating.queue.then(options.work);
  options.context.creating.queue = next.catch(() => undefined);
  return next;
}

export async function createProjectRoute(exchange: Exchange<HomeContext>) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: createBodySchema,
  });
  if (!body.ok) return body.failure;
  const { request, length, video_style: videoStyle, look } = body.value;
  const platformIds = inCatalogOrder(body.value.platform_ids);
  const made = await queued({
    context: exchange.context,
    work: () => makeProjectFolder({ request, platformIds, videoStyle, look }),
  });
  if (!made.ok) return made.failure;
  const folder = made.value;
  await recordRecentProject({ folder, length });
  const engine = await exchange.context.engines.engineFor(folder);
  if (!engine.ok) return { status: 409, ...engine.failure };
  const started = await sendFirstRequest({
    engine: engine.value,
    text: firstRequestTextOf({ request, platformIds, length }),
  });
  const url = started.ok
    ? engine.value.url
    : `${engine.value.url}&first-request=${encodeURIComponent(started.failure.kind)}`;
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      url,
      folder,
      first_request: started.ok
        ? { started: true }
        : { started: false, ...started.failure },
    },
  });
  return undefined;
}
