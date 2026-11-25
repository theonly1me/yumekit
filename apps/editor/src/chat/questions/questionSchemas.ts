import { z } from "zod";

export const questionsEntrySchema = z.object({
  kind: z.literal("questions"),
  id: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      options: z.array(z.string()),
      multiple: z.boolean(),
    }),
  ),
  state: z.enum(["open", "closed"]),
  answers: z.array(
    z.object({
      questionId: z.string(),
      choices: z.array(z.string()),
      ownWords: z.string(),
    }),
  ),
});

export const sentFileSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  kind: z.enum(["image", "audio", "video", "font"]),
});

export const personMessageExtras = {
  files: z.array(sentFileSchema).optional(),
  roundId: z.string().optional(),
};

export type QuestionsEntry = z.infer<typeof questionsEntrySchema>;
export type Question = QuestionsEntry["questions"][number];
export type QuestionAnswer = QuestionsEntry["answers"][number];
export type SentFile = z.infer<typeof sentFileSchema>;
