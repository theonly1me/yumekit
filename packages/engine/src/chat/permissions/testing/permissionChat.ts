import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import { callTool } from "../../../testing/rawRequest.js";
import type { FakeStep, startChatEngine } from "../../testing/chatEngine.js";
import { init, result, whole } from "../../testing/claudeLines.js";

type ChatEngine = Awaited<ReturnType<typeof startChatEngine>>;

const permissionSchema = z.object({
  kind: z.literal("permission"),
  id: z.string(),
  what: z.string(),
  detail: z.string(),
  folder: z.string().optional(),
  state: z.string(),
});

const toolReplySchema = z.object({
  mcpResult: z.object({
    content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
  }),
});

export function savedReplyFile(options: { chat: ChatEngine; name: string }) {
  return join(options.chat.project.root, `${options.name}.json`);
}

export function askSteps(options: {
  chat: ChatEngine;
  asks: { toolName: string; input: object; name: string }[];
}): FakeStep[] {
  return [
    { print: init },
    ...options.asks.map((ask) => ({
      callTool: {
        name: "ask_permission",
        input: { tool_name: ask.toolName, input: ask.input },
        saveResultTo: savedReplyFile({ chat: options.chat, name: ask.name }),
      },
    })),
    { print: whole("I looked at the page.") },
    { print: result("completed") },
  ];
}

export function replyTextOf(body: string): string {
  const [first] = toolReplySchema.parse(JSON.parse(body)).mcpResult.content;
  if (first === undefined) throw new Error("The tool gave no text.");
  return first.text;
}

const permissionReplySchema = z.strictObject({
  behavior: z.enum(["allow", "deny"]),
  message: z.string().optional(),
});

export async function savedReplyOf(options: {
  chat: ChatEngine;
  name: string;
}): Promise<z.infer<typeof permissionReplySchema>> {
  const body = await readFile(savedReplyFile(options), "utf8");
  return permissionReplySchema.parse(JSON.parse(replyTextOf(body)));
}

export async function permissionEntriesOf(chat: ChatEngine) {
  const view = await chat.readChat();
  return view.entries.flatMap((entry) => {
    const parsed = permissionSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function waitForOpenCard(chat: ChatEngine) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const open = (await permissionEntriesOf(chat)).find(
      (entry) => entry.state === "open",
    );
    if (open !== undefined) return open;
    await delay(25);
  }
  throw new Error("No permission card opened.");
}

export function answerCard(options: {
  chat: ChatEngine;
  id: string;
  answer: string;
}) {
  return options.chat.post({
    path: `/api/chat/permissions/${options.id}`,
    body: { answer: options.answer },
  });
}

export async function checkFileOf(options: {
  chat: ChatEngine;
  input: { tool: string; path?: string; command?: string };
}): Promise<unknown> {
  const answer = await callTool({
    ...options.chat.engine,
    name: "check_file_access",
    input: options.input,
    headers: { "x-yumekit-client": "agent" },
  });
  return JSON.parse(replyTextOf(answer.body));
}
