#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLocalVoiceServer } from "./createLocalVoiceServer.ts";
import { kokoroModel } from "./naturalVoice/modelFiles.ts";
import { loadKokoroSpeaker } from "./naturalVoice/naturalSpeaker.ts";
import { kokoroVoices } from "./naturalVoice/voices.ts";

const server = createLocalVoiceServer({
  environment: process.env,
  fetchFile: (url) => fetch(url),
  loadSpeaker: loadKokoroSpeaker,
  naturalModel: kokoroModel,
  voices: kokoroVoices,
});
await server.connect(new StdioServerTransport());
