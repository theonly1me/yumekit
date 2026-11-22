import { readUserLimits } from "@yumekit/tools";
import { z } from "zod";
import type { Exchange, Route } from "../http/exchange.js";
import { readJsonBody } from "../http/readJsonBody.js";
import { sendJson, type Failure } from "../http/responses.js";
import { createProjectRoute } from "./createProjectRoute.js";
import type { HomeContext } from "./homeContext.js";
import { listHomeAgents } from "./homeAgents.js";
import { readProjectsFolder } from "./projectsFolder.js";
import { readProjectFacts } from "./projectFacts.js";
import {
  isRecentFolder,
  listRecentProjects,
  recordRecentProject,
} from "./recentProjects.js";

type HomeExchange = Exchange<HomeContext>;

const openBodySchema = z.strictObject({
  folder: z.string().min(1).max(4_096),
});

const notRecent: Failure = {
  status: 404,
  kind: "project-not-recent",
  message: "This folder is not a recent project. Open it from the list.",
};

function readHealth(exchange: HomeExchange) {
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      name: "yumekit",
      server: "home",
      version: exchange.context.version,
    },
  });
  return Promise.resolve(undefined);
}

async function readHome(exchange: HomeExchange) {
  const projectsFolder = await readProjectsFolder();
  if (!projectsFolder.ok) return { status: 409, ...projectsFolder.failure };
  const limits = await readUserLimits();
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      recent: await listRecentProjects(),
      agents: await listHomeAgents(exchange.context.programs),
      projects_folder: projectsFolder.value,
      generated_video_limit_seconds: limits.ok
        ? limits.value.generatedVideoSeconds
        : null,
    },
  });
  return undefined;
}

async function openRecent(exchange: HomeExchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: openBodySchema,
  });
  if (!body.ok) return body.failure;
  const { folder } = body.value;
  if (!(await isRecentFolder(folder))) return notRecent;
  if ((await readProjectFacts(folder)) === undefined) return notRecent;
  const engine = await exchange.context.engines.engineFor(folder);
  if (!engine.ok) return { status: 409, ...engine.failure };
  await recordRecentProject({ folder });
  sendJson({
    response: exchange.response,
    status: 200,
    body: { url: engine.value.url },
  });
  return undefined;
}

export const homeRoutes: Route<HomeContext>[] = [
  { method: "GET", pattern: ["api", "health"], handle: readHealth },
  { method: "GET", pattern: ["api", "home"], handle: readHome },
  {
    method: "POST",
    pattern: ["api", "home", "projects"],
    handle: createProjectRoute,
  },
  { method: "POST", pattern: ["api", "home", "open"], handle: openRecent },
];
