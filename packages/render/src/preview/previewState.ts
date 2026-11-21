import type { ProjectStore } from "@yumekit/project";
import type { PreviewData } from "../page/previewData.js";
import { loadOutput, openProjectFolder } from "../project/loadOutput.js";
import { fileUrlOf, stagePageDataOf } from "../project/stagePageDataOf.js";
import {
  createVideoFrameServer,
  type VideoFrameServer,
} from "../videoFrames/videoFrameServer.js";

export interface PreviewState {
  previewDataOf: (outputId: string) => Promise<PreviewData>;
  videoFrames: () => VideoFrameServer;
  refresh: () => Promise<number>;
}

function videoFramesOf(options: {
  projectFolder: string;
  store: ProjectStore;
}): VideoFrameServer {
  const snapshot = options.store.read();
  return createVideoFrameServer({
    projectFolder: options.projectFolder,
    framesPerSecond: snapshot.project.framesPerSecond,
    assets: snapshot.assets,
  });
}

export function createPreviewState(options: {
  projectFolder: string;
  store: ProjectStore;
}): PreviewState {
  const { projectFolder } = options;
  let refreshCount = 0;
  let videoFrames = videoFramesOf(options);
  return {
    previewDataOf: async (outputId) => {
      const loaded = await loadOutput({ folder: projectFolder, outputId });
      if (!loaded.ok) {
        return {
          ok: false,
          kind: loaded.failure.kind,
          message: loaded.failure.message,
        };
      }
      const pageData = await stagePageDataOf(loaded.value);
      const moduleSceneUrls = Object.entries(pageData.sceneSources).flatMap(
        ([sceneId, source]) =>
          source.kind === "module"
            ? [
                [
                  sceneId,
                  `${fileUrlOf(source.file)}?refresh=${String(refreshCount)}`,
                ] as const,
              ]
            : [],
      );
      return {
        ok: true,
        pageData,
        moduleSceneUrls: Object.fromEntries(moduleSceneUrls),
        frameCount: loaded.value.frameCount,
      };
    },
    videoFrames: () => videoFrames,
    refresh: async () => {
      const opened = await openProjectFolder(projectFolder);
      if (opened.ok) {
        videoFrames = videoFramesOf({ projectFolder, store: opened.value });
      }
      refreshCount += 1;
      return refreshCount;
    },
  };
}
