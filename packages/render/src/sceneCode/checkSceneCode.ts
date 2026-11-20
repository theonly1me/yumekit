import type { Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { inspectSceneCode } from "./inspectSceneCode.js";
import { typeCheckScene } from "./typeCheckScene.js";

export function checkSceneCode(options: {
  sceneId: string;
  code: string;
}): Promise<Outcome<{ checked: true }, RenderFailure>> {
  const inspected = inspectSceneCode(options);
  return Promise.resolve(inspected.ok ? typeCheckScene(options) : inspected);
}
