import { realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { askingAgentIds } from "@yumekit/brain";
import { z } from "zod";
import {
  addLeadFolder,
  removeLeadFolder,
  removeLeadRule,
  suggestedFoldersOf,
} from "../chat/permissions/leadFolders.js";
import { readLeadPermissions } from "../chat/permissions/leadPermissionsFile.js";
import {
  readLeadAccess,
  saveLeadAccess,
} from "../chat/permissions/leadRunAccess.js";
import { ruleTextOf } from "../chat/permissions/ruleText.js";
import { permissionAnswers } from "../chat/permissions/permissionSchemas.js";
import { leadAccessChoices } from "../chat/settings.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { helperTokenOf } from "./helperCalls.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const notForTheAi: Failure = {
  status: 403,
  kind: "permission-not-for-the-ai",
  message: "Only the person decides what the AI may do.",
};

function isFromTheAi(exchange: Exchange): boolean {
  return (
    exchange.request.headers[clientHeader] === agentClient ||
    helperTokenOf(exchange) !== undefined
  );
}

function personOnly(
  handle: (exchange: Exchange) => Promise<Failure | undefined>,
) {
  return (exchange: Exchange) =>
    isFromTheAi(exchange) ? Promise.resolve(notForTheAi) : handle(exchange);
}

async function sendView(options: { exchange: Exchange; note?: string }) {
  const { projectFolder } = options.exchange.context;
  const stored = await readLeadPermissions(projectFolder);
  sendJson({
    response: options.exchange.response,
    status: 200,
    body: {
      access: await readLeadAccess(),
      askingAgents: askingAgentIds,
      home: await realpath(homedir()).catch(() => homedir()),
      folders: stored.folders,
      rules: stored.rules.map((rule) => ({ rule, text: ruleTextOf(rule) })),
      suggestions: await suggestedFoldersOf(projectFolder),
      ...(options.note === undefined ? {} : { note: options.note }),
    },
  });
  return undefined;
}

const answerSchema = z.strictObject({ answer: z.enum(permissionAnswers) });
const accessSchema = z.strictObject({ access: z.enum(leadAccessChoices) });
const folderSchema = z.strictObject({ folder: z.string().max(4096) });
const ruleSchema = z.strictObject({ rule: z.string().max(20_000) });

async function answerPermission(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: answerSchema,
  });
  if (!body.ok) return body.failure;
  const [id = ""] = exchange.parameters;
  const answered = await exchange.context.chat.permissions.answer({
    id,
    answer: body.value.answer,
  });
  if (!answered.ok) return { status: 409, ...answered.failure };
  sendJson({ response: exchange.response, status: 200, body: answered.value });
  return undefined;
}

async function putAccess(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: accessSchema,
  });
  if (!body.ok) return body.failure;
  const saved = await saveLeadAccess(body.value.access);
  if (!saved.ok) {
    const isNotValid = saved.failure.kind === "settings-not-valid";
    return { status: isNotValid ? 409 : 500, ...saved.failure };
  }
  return sendView({ exchange });
}

async function addFolder(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: folderSchema,
  });
  if (!body.ok) return body.failure;
  const added = await addLeadFolder({
    typed: body.value.folder,
    projectFolder: exchange.context.projectFolder,
  });
  if (!added.ok) {
    const isWrite = added.failure.kind === "folders-not-written";
    return { status: isWrite ? 500 : 400, ...added.failure };
  }
  return sendView({
    exchange,
    ...(added.value.note === undefined ? {} : { note: added.value.note }),
  });
}

async function removeFolder(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: folderSchema,
  });
  if (!body.ok) return body.failure;
  await removeLeadFolder({
    folder: body.value.folder,
    projectFolder: exchange.context.projectFolder,
  });
  return sendView({ exchange });
}

async function removeRule(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: ruleSchema,
  });
  if (!body.ok) return body.failure;
  await removeLeadRule({
    rule: body.value.rule,
    projectFolder: exchange.context.projectFolder,
  });
  return sendView({ exchange });
}

const leadPermissions = ["api", "lead-permissions"];

export const permissionRoutes: Route[] = [
  {
    method: "POST",
    pattern: ["api", "chat", "permissions", anySegment],
    handle: personOnly(answerPermission),
  },
  {
    method: "GET",
    pattern: leadPermissions,
    handle: personOnly((exchange) => sendView({ exchange })),
  },
  {
    method: "PUT",
    pattern: [...leadPermissions, "access"],
    handle: personOnly(putAccess),
  },
  {
    method: "POST",
    pattern: [...leadPermissions, "folders"],
    handle: personOnly(addFolder),
  },
  {
    method: "DELETE",
    pattern: [...leadPermissions, "folders"],
    handle: personOnly(removeFolder),
  },
  {
    method: "DELETE",
    pattern: [...leadPermissions, "rules"],
    handle: personOnly(removeRule),
  },
];
