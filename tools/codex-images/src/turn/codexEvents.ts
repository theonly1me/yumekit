import { z } from "zod";

const eventSchema = z.union([
  z.object({ type: z.literal("thread.started"), thread_id: z.string() }),
  z.object({
    type: z.literal("item.completed"),
    item: z.object({
      type: z.string(),
      text: z.string().optional(),
      message: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("turn.failed"),
    error: z.object({ message: z.string() }),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export interface TurnFacts {
  threadId: string | undefined;
  answers: string[];
  problems: string[];
  failure: string | undefined;
}

const usageLimitText = /usage limit/i;

function innerMessage(text: string): string {
  try {
    const parsed = z
      .object({ error: z.object({ message: z.string() }) })
      .safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.error.message : text;
  } catch {
    return text;
  }
}

function parsedEvent(line: string) {
  try {
    const parsed = eventSchema.safeParse(JSON.parse(line));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function emptyTurnFacts(): TurnFacts {
  return {
    threadId: undefined,
    answers: [],
    problems: [],
    failure: undefined,
  };
}

export function noteEventLine(options: {
  facts: TurnFacts;
  line: string;
}): void {
  const { facts } = options;
  const event = parsedEvent(options.line);
  if (event === undefined) return;
  if (event.type === "thread.started") {
    facts.threadId = event.thread_id;
  } else if (event.type === "turn.failed") {
    facts.failure = innerMessage(event.error.message);
  } else if (event.type === "error") {
    facts.problems.push(innerMessage(event.message));
  } else if (event.item.type === "agent_message" && event.item.text) {
    facts.answers.push(event.item.text);
  } else if (event.item.type === "error" && event.item.message) {
    facts.problems.push(event.item.message);
  }
}

export function usageLimitMessageOf(options: {
  facts: TurnFacts;
  errorText: string;
}): string | undefined {
  const { facts } = options;
  const texts = [
    ...(facts.failure === undefined ? [] : [facts.failure]),
    ...facts.problems,
    ...facts.answers,
    options.errorText,
  ];
  return texts.find((text) => usageLimitText.test(text));
}
