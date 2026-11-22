import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import { chatEntrySchema, chatViewSchema } from "./chatSchemas.js";

export type ChatRequests = ReturnType<typeof chatRequestsOf>;

export interface AskInput {
  text: string;
  aboutClipId: string | undefined;
}

export function chatRequestsOf(client: EngineClient) {
  return {
    view: () => client.readJson({ path: "/api/chat", schema: chatViewSchema }),
    ask: (input: AskInput) =>
      client.readJson({
        path: "/api/chat/requests",
        schema: chatEntrySchema,
        body: { text: input.text, about_clip_id: input.aboutClipId ?? null },
      }),
    stop: () =>
      client.readJson({
        path: "/api/chat/stop",
        schema: z.object({ stopped: z.boolean() }),
        body: {},
      }),
    undo: (changeId: string) =>
      client.readJson({
        path: `/api/chat/changes/${encodeURIComponent(changeId)}/undo`,
        schema: chatEntrySchema,
        body: {},
      }),
    saveAgent: (agent: string) =>
      client.readJson({
        path: "/api/settings/agent",
        method: "PUT",
        schema: z.object({ agent: z.string() }),
        body: { agent },
      }),
  };
}
