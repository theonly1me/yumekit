import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describeLocalVoice, registerDescribeTool } from "./catalog.ts";
import type { FetchFile } from "./naturalVoice/download.ts";
import {
  modelFolderOf,
  sizeTextOf,
  type NaturalModel,
} from "./naturalVoice/modelFiles.ts";
import type { LoadSpeaker } from "./naturalVoice/naturalSpeaker.ts";
import { createNaturalVoice } from "./naturalVoice/naturalVoice.ts";
import { approvedVoicesOf, type VoiceEntry } from "./naturalVoice/voices.ts";
import {
  registerPrepareTool,
  registerSpeechTool,
} from "./speech/registerSpeechTool.ts";

export function createLocalVoiceServer(options: {
  environment: NodeJS.ProcessEnv;
  fetchFile: FetchFile;
  loadSpeaker: LoadSpeaker;
  naturalModel: NaturalModel;
  voices: VoiceEntry[];
}): McpServer {
  const server = new McpServer({
    name: "yumekit-local-voice",
    version: "0.0.0",
  });
  const { naturalModel, voices } = options;
  const naturalVoice = createNaturalVoice({
    folder: modelFolderOf({
      environment: options.environment,
      model: naturalModel,
    }),
    model: naturalModel,
    voices,
    fetchFile: options.fetchFile,
    loadSpeaker: options.loadSpeaker,
  });
  const downloadLine = `Getting the natural voice, one time, ${sizeTextOf(naturalModel)}`;
  const [firstVoice] = approvedVoicesOf(voices);
  registerDescribeTool({
    server,
    describe: () => describeLocalVoice({ naturalVoice, naturalModel, voices }),
  });
  registerSpeechTool({
    server,
    naturalVoice,
    defaultVoice: firstVoice?.name ?? "",
    downloadLine,
  });
  registerPrepareTool({ server, naturalVoice, downloadLine });
  return server;
}
