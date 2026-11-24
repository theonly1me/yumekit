import type { Asset } from "@yumekit/project";
import {
  drawSheet,
  oneColorsOf,
  type SheetPictureType,
} from "../browser/drawSheet.js";
import { launchBrowser } from "../browser/launchBrowser.js";
import {
  openStagePage,
  type BrowserStagePage,
} from "../browser/openStagePage.js";
import { succeed, type Outcome } from "../outcome.js";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import { startStageServer } from "../server/startStageServer.js";
import { stagePagePath, stagePagePlugin } from "../server/stagePagePlugin.js";
import {
  createVideoFrameServer,
  type VideoFrameServer,
} from "../videoFrames/videoFrameServer.js";

export interface StageHost {
  openPage: (options: {
    output: { widthPixels: number; heightPixels: number };
    scale: RenderScale;
  }) => Promise<BrowserStagePage>;
  videoFramesOf: (options: {
    framesPerSecond: number;
    assets: Asset[];
  }) => VideoFrameServer;
  drawSheet: (options: {
    html: string;
    size: { widthPixels: number; heightPixels: number };
    pictureType?: SheetPictureType;
  }) => Promise<Uint8Array>;
  oneColorsOf: (pngs: Uint8Array[]) => Promise<(string | null)[]>;
  isConnected: () => boolean;
  close: () => Promise<void>;
}

function videoAssetsKeyOf(options: {
  framesPerSecond: number;
  assets: Asset[];
}): string {
  return JSON.stringify([
    options.framesPerSecond,
    options.assets
      .filter((asset) => asset.kind === "video")
      .map((asset) => [asset.id, asset.file, asset.durationFrames]),
  ]);
}

export async function startStageHost(options: {
  projectFolder: string;
}): Promise<Outcome<StageHost, RenderFailure>> {
  const { projectFolder } = options;
  const launched = await launchBrowser();
  if (!launched.ok) {
    return launched;
  }
  const browser = launched.value;
  let videoFrames = {
    key: videoAssetsKeyOf({ framesPerSecond: 0, assets: [] }),
    server: createVideoFrameServer({
      projectFolder,
      framesPerSecond: 0,
      assets: [],
    }),
  };
  try {
    const server = await startStageServer({
      projectFolder,
      pagePlugin: stagePagePlugin({ videoFrames: () => videoFrames.server }),
    });
    return succeed({
      openPage: ({ output, scale }) =>
        openStagePage({
          browser,
          pageUrl: `${server.origin}${stagePagePath}`,
          origin: server.origin,
          output,
          scale,
        }),
      videoFramesOf: (project) => {
        const key = videoAssetsKeyOf(project);
        if (key !== videoFrames.key) {
          videoFrames = {
            key,
            server: createVideoFrameServer({ projectFolder, ...project }),
          };
        }
        return videoFrames.server;
      },
      drawSheet: (sheet) => drawSheet({ browser, ...sheet }),
      oneColorsOf: (pngs) => oneColorsOf({ browser, pngs }),
      isConnected: () => browser.isConnected(),
      close: async () => {
        await browser.close();
        await server.close();
      },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}
