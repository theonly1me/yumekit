import type { z } from "zod";
import type { stepProgressSchema } from "../chat/chatSchemas.js";

export interface AnswerStep {
  tool: string;
  state: "running" | "done" | "failed";
  capability?: string | undefined;
  reason?: string | undefined;
  progress?: z.infer<typeof stepProgressSchema> | undefined;
}

export interface AnswerEntry {
  kind: "answer";
  id: string;
  text: string;
  state: "running" | "done" | "stopped" | "failed";
  steps: AnswerStep[];
}
