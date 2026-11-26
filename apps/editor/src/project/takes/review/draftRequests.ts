import { takeDraftSchema } from "@yumekit/project/takes";
import { z } from "zod";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { ItemDraft } from "./itemDrafts.js";

const savedSchema = z.object({ savedAt: z.string() });

function draftPathOf(draftId: string): string {
  return `/api/take-drafts/${encodeURIComponent(draftId)}`;
}

export function readDraft(options: { client: EngineClient; draftId: string }) {
  return options.client.readJson({
    path: draftPathOf(options.draftId),
    schema: takeDraftSchema,
  });
}

export function saveDraft(options: {
  client: EngineClient;
  draftId: string;
  itemId: string;
  draft: ItemDraft;
}) {
  return options.client.readJson({
    path: `${draftPathOf(options.draftId)}/${encodeURIComponent(options.itemId)}`,
    method: "PUT",
    body: options.draft,
    schema: savedSchema,
  });
}

export function removeDraft(options: {
  client: EngineClient;
  draftId: string;
}) {
  return options.client.readJson({
    path: draftPathOf(options.draftId),
    method: "DELETE",
    schema: z.object({}),
  });
}
