import { z } from "zod";
import type { PersonRequestInput } from "../chat/questions/personRequest.js";

const fileBodySchema = z.strictObject({
  asset_id: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(200),
});

export const messageFields = {
  text: z.string().trim().max(20_000),
  details: z.string().trim().min(1).max(20_000).optional(),
  about_clip_id: z.string().min(1).max(200).nullable().optional(),
  files: z.array(fileBodySchema).max(20).optional(),
};

const answerBodySchema = z.strictObject({
  question_id: z.string().min(1).max(200),
  choices: z.array(z.string().max(200)).max(6),
  own_words: z.string().trim().max(4_000).optional(),
});

export const requestBodySchema = z
  .strictObject(messageFields)
  .refine((body) => body.text !== "" || (body.files ?? []).length > 0, {
    path: ["text"],
    message: "Write a message, or add a file.",
  });

export const answersBodySchema = z.strictObject({
  ...messageFields,
  text: messageFields.text.optional(),
  round_id: z.string().min(1).max(200),
  answers: z.array(answerBodySchema).max(20),
});

export function messageInputOf(body: {
  text?: string | undefined;
  details?: string | undefined;
  about_clip_id?: string | null | undefined;
  files?: { asset_id: string; name: string }[] | undefined;
}): PersonRequestInput {
  return {
    text: body.text ?? "",
    details: body.details,
    aboutClipId: body.about_clip_id ?? undefined,
    files: (body.files ?? []).map((file) => ({
      assetId: file.asset_id,
      name: file.name,
    })),
  };
}

export function answersInputOf(
  body: z.infer<typeof answersBodySchema>,
): PersonRequestInput {
  return {
    ...messageInputOf(body),
    answers: {
      roundId: body.round_id,
      answers: body.answers.map((answer) => ({
        questionId: answer.question_id,
        choices: answer.choices,
        ownWords: answer.own_words ?? "",
      })),
    },
  };
}
