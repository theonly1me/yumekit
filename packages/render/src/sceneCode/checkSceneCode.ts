import type { Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { inspectSceneCode } from "./inspectSceneCode.js";
import { sharedCodeIdOf } from "./sharedImports.js";
import { typeCheckScene } from "./typeCheckScene.js";

type SharedCode = Readonly<Record<string, string>>;

export function checkSceneCode(options: {
  sceneId: string;
  code: string;
  sharedCode?: SharedCode;
}): Promise<Outcome<{ checked: true }, RenderFailure>> {
  const sharedCode = options.sharedCode ?? {};
  const inspected = inspectSceneCode({
    ...options,
    sharedNames: Object.keys(sharedCode),
  });
  return Promise.resolve(
    inspected.ok ? typeCheckScene({ ...options, sharedCode }) : inspected,
  );
}

export function checkSharedCode(options: {
  name: string;
  code: string;
  sharedCode: SharedCode;
}): Promise<Outcome<{ checked: true }, RenderFailure>> {
  const { name, code } = options;
  const sceneId = sharedCodeIdOf(name);
  const others = Object.fromEntries(
    Object.entries(options.sharedCode).filter(([other]) => other !== name),
  );
  const inspected = inspectSceneCode({
    sceneId,
    code,
    sharedNames: Object.keys(others),
  });
  return Promise.resolve(
    inspected.ok
      ? typeCheckScene({
          sceneId,
          code,
          sharedCode: { ...others, [name]: code },
        })
      : inspected,
  );
}
