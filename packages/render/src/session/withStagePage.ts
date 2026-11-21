import { launchBrowser } from "../browser/launchBrowser.js";
import { openStagePage, type StagePage } from "../browser/openStagePage.js";
import { fail, type Outcome } from "../outcome.js";
import { checkModuleScenes } from "../project/checkModuleScenes.js";
import type { LoadedOutput } from "../project/loadOutput.js";
import { stagePageDataOf } from "../project/stagePageDataOf.js";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import {
  startStageServer,
  type StageServer,
} from "../server/startStageServer.js";
import { stagePagePath, stagePagePlugin } from "../server/stagePagePlugin.js";
import { createVideoFrameServer } from "../videoFrames/videoFrameServer.js";

export async function withStagePage<Value>(options: {
  loaded: LoadedOutput;
  scale: RenderScale;
  use: (stagePage: StagePage) => Promise<Outcome<Value, RenderFailure>>;
}): Promise<Outcome<Value, RenderFailure>> {
  const { loaded, scale } = options;
  const sceneFailure = checkModuleScenes(loaded);
  if (sceneFailure !== undefined) {
    return fail(sceneFailure);
  }
  const pageData = await stagePageDataOf(loaded);
  const launched = await launchBrowser();
  if (!launched.ok) {
    return launched;
  }
  const browser = launched.value;
  let server: StageServer | undefined;
  try {
    const videoFrames = createVideoFrameServer({
      projectFolder: loaded.folder,
      framesPerSecond: loaded.snapshot.project.framesPerSecond,
      assets: loaded.snapshot.assets,
    });
    server = await startStageServer({
      projectFolder: loaded.folder,
      pagePlugin: stagePagePlugin({ pageData, videoFrames }),
    });
    const browserPage = await openStagePage({
      browser,
      pageUrl: `${server.origin}${stagePagePath}`,
      origin: server.origin,
      output: loaded.output,
      scale,
    });
    return await options.use({
      ...browserPage,
      videoFramesFailure: videoFrames.failure,
    });
  } finally {
    await browser.close();
    await server?.close();
  }
}
