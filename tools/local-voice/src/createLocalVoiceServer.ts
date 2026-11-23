import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describeLocalVoice, registerDescribeTool } from "./catalog.ts";
import type { FetchFile } from "./naturalVoice/download.ts";
import { modelFolderOf, type NaturalModel } from "./naturalVoice/modelFiles.ts";
import type { LoadSpeaker } from "./naturalVoice/naturalSpeaker.ts";
import { createNaturalVoice } from "./naturalVoice/naturalVoice.ts";
import { registerSpeechTool } from "./speech/registerSpeechTool.ts";
import type { RunProgram } from "./systemVoice/runProgram.ts";
import { systemVoiceOf } from "./systemVoice/systemVoice.ts";

export function createLocalVoiceServer(options: {
  platform: NodeJS.Platform;
  environment: NodeJS.ProcessEnv;
  runProgram: RunProgram;
  fetchFile: FetchFile;
  loadSpeaker: LoadSpeaker;
  naturalModel: NaturalModel;
}): McpServer {
  const server = new McpServer({
    name: "yumekit-local-voice",
    version: "0.0.0",
  });
  const systemVoice = systemVoiceOf({
    platform: options.platform,
    run: options.runProgram,
  });
  const naturalVoice = createNaturalVoice({
    folder: modelFolderOf({
      environment: options.environment,
      model: options.naturalModel,
    }),
    model: options.naturalModel,
    fetchFile: options.fetchFile,
    loadSpeaker: options.loadSpeaker,
  });
  registerDescribeTool({
    server,
    describe: () =>
      describeLocalVoice({
        systemVoice,
        naturalVoice,
        naturalModel: options.naturalModel,
      }),
  });
  registerSpeechTool({ server, systemVoice, naturalVoice });
  return server;
}
