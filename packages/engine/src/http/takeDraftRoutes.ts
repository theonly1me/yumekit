import { draftItemIdSchema, itemDraftSchema } from "@yumekit/project";
import {
  readTakeDraft,
  removeTakeDraft,
  saveItemDraft,
  storyDraftId,
} from "../takeDrafts/takeDraftFile.js";
import { isAgentCall } from "./chatRoutes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { notFound, sendJson, type Failure } from "./responses.js";

const notForTheAi: Failure = {
  status: 403,
  kind: "draft-not-for-the-ai",
  message: "Only the person writes the review of a take.",
};

function draftIdOf(
  exchange: Exchange,
): { ok: true; draftId: string } | { ok: false; failure: Failure } {
  const [draftId = ""] = exchange.parameters;
  if (draftId === storyDraftId) return { ok: true, draftId };
  const take = exchange.context.store
    .read()
    .takes.find((candidate) => candidate.id === draftId);
  if (take === undefined) {
    return {
      ok: false,
      failure: notFound(`The project has no take "${draftId}".`),
    };
  }
  if (take.state === "sent") {
    return {
      ok: false,
      failure: {
        status: 409,
        kind: "take-already-sent",
        message: `Take ${String(take.number)} is sent. Its review went to the lead.`,
      },
    };
  }
  return { ok: true, draftId };
}

async function getDraft(exchange: Exchange): Promise<Failure | undefined> {
  const target = draftIdOf(exchange);
  if (!target.ok) return target.failure;
  const draft = await readTakeDraft({
    projectFolder: exchange.context.projectFolder,
    draftId: target.draftId,
  });
  sendJson({ response: exchange.response, status: 200, body: draft });
  return undefined;
}

async function putItem(exchange: Exchange): Promise<Failure | undefined> {
  if (isAgentCall(exchange)) return notForTheAi;
  const target = draftIdOf(exchange);
  if (!target.ok) return target.failure;
  const itemId = draftItemIdSchema.safeParse(exchange.parameters[1]);
  if (!itemId.success) return notFound("The item id is not valid.");
  const body = await readJsonBody({
    request: exchange.request,
    schema: itemDraftSchema,
  });
  if (!body.ok) return body.failure;
  const saved = await saveItemDraft({
    projectFolder: exchange.context.projectFolder,
    draftId: target.draftId,
    itemId: itemId.data,
    draft: body.value,
  });
  if (!saved.ok) {
    return { status: 500, kind: "draft-not-saved", message: saved.failure };
  }
  sendJson({ response: exchange.response, status: 200, body: saved.value });
  return undefined;
}

async function deleteDraft(exchange: Exchange): Promise<Failure | undefined> {
  if (isAgentCall(exchange)) return notForTheAi;
  const target = draftIdOf(exchange);
  if (!target.ok) return target.failure;
  await removeTakeDraft({
    projectFolder: exchange.context.projectFolder,
    draftId: target.draftId,
  });
  sendJson({ response: exchange.response, status: 200, body: {} });
  return undefined;
}

export const takeDraftRoutes: Route[] = [
  {
    method: "GET",
    pattern: ["api", "take-drafts", anySegment],
    handle: getDraft,
  },
  {
    method: "DELETE",
    pattern: ["api", "take-drafts", anySegment],
    handle: deleteDraft,
  },
  {
    method: "PUT",
    pattern: ["api", "take-drafts", anySegment, anySegment],
    handle: putItem,
  },
];
