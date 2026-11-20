#!/usr/bin/env node
import { setTimeout } from "node:timers/promises";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createFalMediaServer } from "./createFalMediaServer.ts";

const server = createFalMediaServer({
  environment: process.env,
  sendRequest: (request) => fetch(request),
  wait: ({ seconds, signal }) =>
    setTimeout(seconds * 1000, undefined, { signal }).catch(() => undefined),
});
await server.connect(new StdioServerTransport());
