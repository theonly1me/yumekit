import type { StagePage } from "../browser/openStagePage.js";
import { fail, type Outcome } from "../outcome.js";
import { checkModuleScenes } from "../project/checkModuleScenes.js";
import type { LoadedOutput } from "../project/loadOutput.js";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import { loadStagePage } from "./loadStagePage.js";
import { startStageHost } from "./stageHost.js";

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
  const started = await startStageHost({ projectFolder: loaded.folder });
  if (!started.ok) {
    return started;
  }
  const host = started.value;
  try {
    const page = await host.openPage({ output: loaded.output, scale });
    return await options.use(await loadStagePage({ host, page, loaded }));
  } finally {
    await host.close();
  }
}
