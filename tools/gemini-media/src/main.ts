#!/usr/bin/env node
import { setTimeout } from "node:timers/promises";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGeminiMediaServer } from "./createGeminiMediaServer.ts";

const server = createGeminiMediaServer({
  environment: process.env,
  sendRequest: (request) => fetch(request),
  wait: async (seconds) => {
    await setTimeout(seconds * 1000);
  },
});
await server.connect(new StdioServerTransport());
