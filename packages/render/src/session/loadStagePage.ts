import type { BrowserStagePage, StagePage } from "../browser/openStagePage.js";
import type { LoadedOutput } from "../project/loadOutput.js";
import { stagePageLoadOf } from "../project/stagePageLoadOf.js";
import type { StageHost } from "./stageHost.js";

export async function loadStagePage(options: {
  host: StageHost;
  page: BrowserStagePage;
  loaded: LoadedOutput;
}): Promise<StagePage> {
  const { host, page, loaded } = options;
  const videoFrames = host.videoFramesOf({
    framesPerSecond: loaded.snapshot.project.framesPerSecond,
    assets: loaded.snapshot.assets,
  });
  await page.load(await stagePageLoadOf(loaded));
  return {
    seek: page.seek,
    screenshot: page.screenshot,
    inspect: page.inspect,
    videoFramesFailure: videoFrames.failure,
  };
}
