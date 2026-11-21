import { realpath } from "node:fs/promises";
import { succeed, type Outcome } from "../outcome.js";
import { previewPagePath } from "../page/previewData.js";
import { openProjectFolder } from "../project/loadOutput.js";
import type { RenderFailure } from "../renderFailure.js";
import { startStageServer } from "../server/startStageServer.js";
import { createPreviewEvents } from "./previewEvents.js";
import { previewPagePlugin } from "./previewPagePlugin.js";
import { createPreviewState } from "./previewState.js";

export interface PreviewServer {
  pageUrlOf: (outputId: string) => string;
  refresh: () => Promise<void>;
  close: () => Promise<void>;
}

export async function startPreviewServer(options: {
  projectFolder: string;
}): Promise<Outcome<PreviewServer, RenderFailure>> {
  const opened = await openProjectFolder(options.projectFolder);
  if (!opened.ok) {
    return opened;
  }
  const projectFolder = await realpath(options.projectFolder);
  const state = createPreviewState({ projectFolder, store: opened.value });
  const events = createPreviewEvents();
  const server = await startStageServer({
    projectFolder,
    pagePlugin: previewPagePlugin({ state, events }),
  });
  return succeed({
    pageUrlOf: (outputId) =>
      `${server.origin}${previewPagePath}?output=${encodeURIComponent(outputId)}`,
    refresh: async () => {
      events.sendRefresh(await state.refresh());
    },
    close: async () => {
      events.close();
      await server.close();
    },
  });
}
