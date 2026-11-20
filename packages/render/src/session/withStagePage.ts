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
    server = await startStageServer({ projectFolder: loaded.folder, pageData });
    const stagePage = await openStagePage({
      browser,
      pageUrl: server.pageUrl,
      origin: server.origin,
      output: loaded.output,
      scale,
    });
    return await options.use(stagePage);
  } finally {
    await browser.close();
    await server?.close();
  }
}
