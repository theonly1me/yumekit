import type { BrowserStagePage } from "../browser/openStagePage.js";
import type { Outcome } from "../outcome.js";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import { startStageHost, type StageHost } from "../session/stageHost.js";

export interface PageSize {
  output: { widthPixels: number; heightPixels: number };
  scale: RenderScale;
}

interface KeptPage {
  page: Promise<BrowserStagePage>;
  queue: Promise<unknown>;
}

export interface KeptStage {
  host: StageHost;
  onPage: <Value>(options: {
    size: PageSize;
    work: (page: BrowserStagePage) => Promise<Value>;
  }) => Promise<Value>;
}

function keyOf(size: PageSize): string {
  return `${String(size.output.widthPixels)}x${String(size.output.heightPixels)}@${String(size.scale)}`;
}

function afterEither(promise: Promise<unknown>): Promise<undefined> {
  return promise.then(
    () => undefined,
    () => undefined,
  );
}

export async function startKeptStage(options: {
  projectFolder: string;
}): Promise<Outcome<KeptStage, RenderFailure>> {
  const started = await startStageHost(options);
  if (!started.ok) {
    return started;
  }
  const host = started.value;
  const pages = new Map<string, KeptPage>();
  const forget = async (entry: { key: string; kept: KeptPage }) => {
    if (pages.get(entry.key) !== entry.kept) return;
    pages.delete(entry.key);
    await entry.kept.page.then(
      (page) => page.close(),
      () => undefined,
    );
  };
  return {
    ok: true,
    value: {
      host,
      onPage: ({ size, work }) => {
        const key = keyOf(size);
        const kept = pages.get(key) ?? {
          page: host.openPage(size),
          queue: Promise.resolve(),
        };
        pages.set(key, kept);
        const result = kept.queue.then(async () => {
          try {
            return await work(await kept.page);
          } catch (error) {
            await afterEither(forget({ key, kept }));
            throw error;
          }
        });
        kept.queue = afterEither(result);
        return result;
      },
    },
  };
}
