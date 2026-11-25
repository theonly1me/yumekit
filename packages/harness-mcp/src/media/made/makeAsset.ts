import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { JsonObject, ProjectSnapshot } from "@yumekit/project";
import type { HarnessContext } from "../../context.js";
import type { ProgressListener } from "../../harness/toolTable.js";
import { failureResult } from "../../results.js";
import type { WorkTicket } from "../../work/board/workBoard.js";
import { assetFilesFolder } from "../assetFiles.js";
import type { GenerateAssetInput } from "../generateAssetInput.js";
import { mediaFailureOf } from "../mediaFailures.js";
import { voicePathInput, type TalkingVoice } from "../talkingVoice.js";
import { addMadeAsset } from "./addMadeAsset.js";

export async function makeAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  snapshot: ProjectSnapshot;
  sent: JsonObject;
  voice: TalkingVoice | undefined;
  tool: string;
  input: JsonObject;
  notes: (string | undefined)[];
  ticket: WorkTicket;
  onProgress: ProgressListener | undefined;
  quotaServers: Set<string> | undefined;
}): Promise<CallToolResult> {
  const { context, request, voice, onProgress, quotaServers } = options;
  const projectFolder = context.store.folder;
  const voicePath = await voicePathInput({
    voice,
    projectFolder,
    assetId: request.asset_id,
  });
  if (!voicePath.ok) return failureResult(voicePath.failure);
  const ran = await context.mediaTools.run({
    capability: request.capability,
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
    input: { ...options.sent, ...voicePath.value },
    ...(voice === undefined ? {} : { expectedSeconds: voice.seconds }),
    outputDirectory: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
    onState: (state) => {
      options.ticket.update(state);
    },
    ...(onProgress === undefined ? {} : { onProgress }),
    ...(quotaServers === undefined
      ? {}
      : {
          skipServers: () => quotaServers,
          onServiceQuota: (server: string) => {
            quotaServers.add(server);
          },
        }),
  });
  if (!ran.ok) return failureResult(mediaFailureOf(ran.failure));
  return addMadeAsset({
    context,
    request,
    snapshot: options.snapshot,
    run: ran.value,
    tool: options.tool,
    input: options.input,
    notes: options.notes.filter((note) => note !== undefined),
  });
}
