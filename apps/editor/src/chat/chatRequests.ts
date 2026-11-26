import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import {
  chatEntrySchema,
  chatViewSchema,
  type MoneyChoice,
} from "./chatSchemas.js";
import type { SentFileInput } from "./files/pendingFile.js";
import type { PermissionAnswer } from "./permissions/permissionSchemas.js";
import type { AnswerInput } from "./questions/roundAnswers.js";

export type ChatRequests = ReturnType<typeof chatRequestsOf>;

export interface AskInput {
  text: string;
  details?: string | undefined;
  aboutClipId: string | undefined;
  files?: SentFileInput[] | undefined;
  answers?: { roundId: string; answers: AnswerInput[] } | undefined;
}

function askBodyOf(input: AskInput) {
  const files = input.files ?? [];
  return {
    text: input.text,
    ...(input.details === undefined ? {} : { details: input.details }),
    about_clip_id: input.aboutClipId ?? null,
    ...(files.length === 0
      ? {}
      : {
          files: files.map((file) => ({
            asset_id: file.assetId,
            name: file.name,
          })),
        }),
  };
}

function answersBodyOf(answers: NonNullable<AskInput["answers"]>) {
  return {
    round_id: answers.roundId,
    answers: answers.answers.map((answer) => ({
      question_id: answer.questionId,
      choices: answer.choices,
      own_words: answer.ownWords,
    })),
  };
}

export function chatRequestsOf(client: EngineClient) {
  return {
    view: () => client.readJson({ path: "/api/chat", schema: chatViewSchema }),
    ask: (input: AskInput) =>
      client.readJson({
        path:
          input.answers === undefined
            ? "/api/chat/requests"
            : "/api/chat/answers",
        schema: chatEntrySchema,
        body: {
          ...askBodyOf(input),
          ...(input.answers === undefined ? {} : answersBodyOf(input.answers)),
        },
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
    chooseMoney: (options: { entryId: string; choice: MoneyChoice }) =>
      client.readJson({
        path: `/api/chat/money/${encodeURIComponent(options.entryId)}`,
        schema: chatEntrySchema,
        body: { choice: options.choice },
      }),
    answerPermission: (options: {
      entryId: string;
      answer: PermissionAnswer;
    }) =>
      client.readJson({
        path: `/api/chat/permissions/${encodeURIComponent(options.entryId)}`,
        schema: chatEntrySchema,
        body: { answer: options.answer },
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
