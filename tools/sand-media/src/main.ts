#!/usr/bin/env node
import { setTimeout } from "node:timers/promises";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSandMediaServer } from "./createSandMediaServer.ts";

const server = createSandMediaServer({
  environment: process.env,
  sendRequest: (request) => fetch(request),
  wait: async (seconds) => {
    await setTimeout(seconds * 1000);
  },
});
await server.connect(new StdioServerTransport());
