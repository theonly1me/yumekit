import { realpath } from "node:fs/promises";
import {
  drawContactSheet,
  type ContactSheet,
  type ContactSheetRequest,
} from "../contactSheet/drawContactSheet.js";
import type { Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import {
  drawPictures,
  type OnStage,
  type PictureRequest,
} from "./drawPictures.js";
import { startKeptStage, type KeptStage } from "./keptStage.js";
import type { RenderedFrame } from "../session/drawStills.js";

export interface PictureRenderer {
  renderFrames: (
    request: Omit<Extract<PictureRequest, { kind: "frames" }>, "kind">,
  ) => Promise<Outcome<RenderedFrame[], RenderFailure>>;
  renderSceneFrames: (
    request: Omit<Extract<PictureRequest, { kind: "scenes" }>, "kind">,
  ) => Promise<Outcome<RenderedFrame[], RenderFailure>>;
  renderContactSheet: (
    request: ContactSheetRequest,
  ) => Promise<Outcome<ContactSheet, RenderFailure>>;
  close: () => Promise<void>;
}

const defaultIdleMilliseconds = 60_000;

type KeptOutcome = Outcome<KeptStage, RenderFailure>;

export function createPictureRenderer(options: {
  folder: string;
  idleMilliseconds?: number;
}): PictureRenderer {
  const idleMilliseconds = options.idleMilliseconds ?? defaultIdleMilliseconds;
  let kept: Promise<KeptOutcome> | undefined;
  let idleTimer: NodeJS.Timeout | undefined;
  let isClosed = false;
  const running = new Set<Promise<unknown>>();

  const start = async (): Promise<KeptOutcome> => {
    try {
      const started = await startKeptStage({
        projectFolder: await realpath(options.folder),
      });
      if (!started.ok) kept = undefined;
      return started;
    } catch (error) {
      kept = undefined;
      throw error;
    }
  };
  const stop = async (instance: Promise<KeptOutcome> | undefined) => {
    if (instance === undefined || kept !== instance) return;
    kept = undefined;
    const stopped = await instance.catch(() => undefined);
    if (stopped?.ok === true) await stopped.value.host.close();
  };
  const onStage: OnStage = async (work) => {
    const attempt = async (
      isLastTry: boolean,
    ): ReturnType<typeof work.draw> => {
      const instance = (kept ??= start());
      const started = await instance;
      if (!started.ok) return started;
      const { host, onPage } = started.value;
      try {
        return await onPage({
          size: work.size,
          work: (page) => work.draw({ host, page }),
        });
      } catch (error) {
        if (isLastTry || host.isConnected()) throw error;
        await stop(instance);
        return attempt(true);
      }
    };
    return attempt(false);
  };
  const call = async <Value>(run: () => Promise<Value>): Promise<Value> => {
    if (isClosed) throw new Error("The picture renderer is closed");
    clearTimeout(idleTimer);
    const pending = run();
    running.add(pending);
    try {
      return await pending;
    } finally {
      running.delete(pending);
      if (running.size === 0) {
        idleTimer = setTimeout(() => {
          stop(kept).catch(() => undefined);
        }, idleMilliseconds);
        idleTimer.unref();
      }
    }
  };
  const render = (request: PictureRequest) =>
    call(() => drawPictures({ folder: options.folder, request, onStage }));
  return {
    renderFrames: (request) => render({ kind: "frames", ...request }),
    renderSceneFrames: (request) => render({ kind: "scenes", ...request }),
    renderContactSheet: (request) =>
      call(() =>
        drawContactSheet({ folder: options.folder, request, onStage }),
      ),
    close: async () => {
      isClosed = true;
      clearTimeout(idleTimer);
      await Promise.allSettled([...running]);
      await stop(kept);
    },
  };
}
