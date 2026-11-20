import type { StageOptions } from "@yumekit/stage";
import type { SceneErrorLog } from "./sceneErrorLog.js";
import { messageOf, SceneFailure } from "./sceneFailure.js";

export type SceneModule = Awaited<ReturnType<StageOptions["loadScene"]>>;
type MountedScene = Awaited<ReturnType<SceneModule["mount"]>>;

async function withinTime<Value>(options: {
  sceneId: string;
  timeoutMilliseconds: number;
  work: () => Promise<Value>;
}): Promise<Value> {
  const { sceneId, timeoutMilliseconds } = options;
  const timeout = Promise.withResolvers<never>();
  const timer = setTimeout(() => {
    timeout.reject(
      new SceneFailure({
        sceneId,
        message: `Scene "${sceneId}" took more than ${String(timeoutMilliseconds / 1000)} seconds to draw a frame`,
      }),
    );
  }, timeoutMilliseconds);
  try {
    return await Promise.race([options.work(), timeout.promise]);
  } catch (error) {
    throw error instanceof SceneFailure
      ? error
      : new SceneFailure({ sceneId, message: messageOf(error), cause: error });
  } finally {
    clearTimeout(timer);
  }
}

export function guardScene(options: {
  sceneId: string;
  sceneModule: SceneModule;
  errorLog: SceneErrorLog;
  timeoutMilliseconds: number;
  onSeek: (sceneId: string) => void;
}): SceneModule {
  const { sceneId, sceneModule, errorLog, timeoutMilliseconds, onSeek } =
    options;
  const guarded = <Value>(run: () => Promise<Value>) =>
    withinTime({
      sceneId,
      timeoutMilliseconds,
      work: () => errorLog.runAs({ sceneId, run }),
    });
  return {
    mount: async (mountOptions) => {
      const mounted: MountedScene = await guarded(() =>
        sceneModule.mount(mountOptions),
      );
      return {
        seek: (frame) => {
          onSeek(sceneId);
          return guarded(() => mounted.seek(frame));
        },
        dispose: () => {
          errorLog.runAs({
            sceneId,
            run: () => {
              mounted.dispose();
            },
          });
        },
      };
    },
  };
}
