#!/usr/bin/env node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLocalMusicServer } from "./createLocalMusicServer.ts";
import { styleEntries } from "./styles/styleList.ts";

const isSourceCheckout = existsSync(
  fileURLToPath(new URL("../src", import.meta.url)),
);
const server = createLocalMusicServer({
  styles: styleEntries,
  withWaitingStyles: isSourceCheckout,
});
await server.connect(new StdioServerTransport());
