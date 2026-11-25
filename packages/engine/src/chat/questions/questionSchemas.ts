import { z } from "zod";

export const personQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  multiple: z.boolean(),
});

export const personAnswerSchema = z.object({
  questionId: z.string(),
  choices: z.array(z.string()),
  ownWords: z.string(),
});

export const questionsEntrySchema = z.object({
  kind: z.literal("questions"),
  id: z.string(),
  questions: z.array(personQuestionSchema),
  state: z.enum(["open", "closed"]),
  answers: z.array(personAnswerSchema),
});

export const requestFileSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  kind: z.enum(["image", "audio", "video", "font"]),
});

export const personMessageExtras = {
  files: z.array(requestFileSchema).optional(),
  roundId: z.string().optional(),
};

export type PersonAnswer = z.infer<typeof personAnswerSchema>;
export type QuestionsEntry = z.infer<typeof questionsEntrySchema>;
export type RequestFile = z.infer<typeof requestFileSchema>;
