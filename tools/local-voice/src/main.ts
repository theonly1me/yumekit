#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLocalVoiceServer } from "./createLocalVoiceServer.ts";
import { kokoroModel } from "./naturalVoice/modelFiles.ts";
import { loadKokoroSpeaker } from "./naturalVoice/naturalSpeaker.ts";
import { runProgram } from "./systemVoice/runProgram.ts";

const server = createLocalVoiceServer({
  platform: process.platform,
  environment: process.env,
  runProgram,
  fetchFile: (url) => fetch(url),
  loadSpeaker: loadKokoroSpeaker,
  naturalModel: kokoroModel,
});
await server.connect(new StdioServerTransport());
