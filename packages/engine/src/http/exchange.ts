import type { IncomingMessage, ServerResponse } from "node:http";
import type { Harness } from "@yumekit/harness-mcp";
import type { ProjectStore } from "@yumekit/project";
import type { PreviewServer } from "@yumekit/render";
import type { MediaTools } from "@yumekit/tools";
import type { ServerCommand } from "../agents/agentTypes.js";
import type { Chat } from "../chat/chat.js";
import type { EventHub } from "../events/eventHub.js";
import type { Failure } from "./responses.js";

export interface EngineContext {
  origin: string;
  projectFolder: string;
  version: string;
  store: ProjectStore;
  harness: Harness;
  mediaTools: MediaTools;
  preview: PreviewServer;
  events: EventHub;
  chat: Chat;
  serverCommand: ServerCommand | undefined;
}

export interface Exchange {
  request: IncomingMessage;
  response: ServerResponse;
  context: EngineContext;
  parameters: string[];
  query: URLSearchParams;
}

export type RouteResult = Failure | undefined;

export interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE";
  pattern: string[];
  handle: (exchange: Exchange) => Promise<RouteResult>;
}

export const anySegment = ":";
