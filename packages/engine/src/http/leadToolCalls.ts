import {
  fileCheckToolName,
  leadToolNames,
  permissionToolName,
} from "@yumekit/brain";
import { z } from "zod";
import { noDecisionReply } from "../chat/permissions/permissionReplies.js";
import type { Exchange } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson } from "./responses.js";

const stringProperty = { type: "string" };

export const leadToolListings = [
  {
    name: permissionToolName,
    description:
      "The agent program calls this tool itself when an action needs the yes of the person. The person sees a card in the chat. Never call it yourself.",
    inputSchema: {
      type: "object",
      properties: {
        tool_name: stringProperty,
        input: { type: "object" },
        tool_use_id: stringProperty,
      },
    },
  },
  {
    name: fileCheckToolName,
    description:
      "The agent program calls this tool itself before it reads a file or runs a command, to learn if the path is outside the project. Never call it yourself.",
    inputSchema: {
      type: "object",
      properties: {
        tool: stringProperty,
        path: stringProperty,
        command: stringProperty,
      },
    },
  },
];

const callSchema = z.object({
  input: z.looseObject({
    tool_name: z.string().optional(),
    input: z.record(z.string(), z.unknown()).optional(),
    tool: z.string().optional(),
    path: z.string().optional(),
    command: z.string().optional(),
  }),
});

export function isLeadTool(name: string): boolean {
  return leadToolNames.includes(name);
}

async function replyOf(options: {
  exchange: Exchange;
  name: string;
  isLead: boolean;
  input: z.infer<typeof callSchema>["input"];
}): Promise<string> {
  const { exchange, input, isLead } = options;
  const { chat } = exchange.context;
  if (options.name === fileCheckToolName) {
    return isLead
      ? chat.permissions.checkFile({
          tool: input.tool,
          path: input.path,
          command: input.command,
        })
      : noDecisionReply;
  }
  return chat.permissions.ask({
    call: { toolName: input.tool_name ?? "", input: input.input ?? {} },
    isLead,
  });
}

export async function callLeadTool(options: {
  exchange: Exchange;
  name: string;
  isLead: boolean;
}) {
  const body = await readJsonBody({
    request: options.exchange.request,
    schema: callSchema,
  });
  if (!body.ok) return body.failure;
  const text = await replyOf({ ...options, input: body.value.input });
  sendJson({
    response: options.exchange.response,
    status: 200,
    body: { isError: false, mcpResult: { content: [{ type: "text", text }] } },
  });
  return undefined;
}
