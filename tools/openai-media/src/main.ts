#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOpenAiMediaServer } from "./createOpenAiMediaServer.ts";

const server = createOpenAiMediaServer({
  environment: process.env,
  sendRequest: (request) => fetch(request),
});
await server.connect(new StdioServerTransport());
