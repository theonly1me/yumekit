#!/usr/bin/env node
import { homedir } from "node:os";
import { join } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCodexImagesServer } from "./createCodexImagesServer.ts";
import { findCodex } from "./readiness.ts";

const turnLimitSeconds = 300;
const chosenHome = process.env["CODEX_HOME"];

const server = createCodexImagesServer({
  findProgram: () => findCodex(process.env),
  environment: process.env,
  codexHome:
    chosenHome === undefined || chosenHome === ""
      ? join(homedir(), ".codex")
      : chosenHome,
  turnLimitSeconds,
});
await server.connect(new StdioServerTransport());
