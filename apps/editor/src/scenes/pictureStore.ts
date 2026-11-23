import type { EngineClient } from "../engine/engineClient.js";

export type ScenePicture =
  { kind: "ready"; source: string } | { kind: "failed" };

export type PictureTarget =
  { kind: "frame"; frame: number } | { kind: "scene"; sceneId: string };

export interface PictureAsk {
  key: string;
  target: PictureTarget;
}

type PictureCaller = Pick<EngineClient, "callTool">;

const picturesInOneCall = 8;
const keptPictureCount = 300;
const storesByCaller = new WeakMap<
  PictureCaller,
  Map<string, Promise<ScenePicture>>
>();

const failedPicture: Promise<ScenePicture> = Promise.resolve({
  kind: "failed",
});

function storeOf(caller: PictureCaller): Map<string, Promise<ScenePicture>> {
  const known = storesByCaller.get(caller);
  if (known !== undefined) return known;
  const made = new Map<string, Promise<ScenePicture>>();
  storesByCaller.set(caller, made);
  return made;
}

function groupsOf<Item>(items: Item[]): Item[][] {
  const groups: Item[][] = [];
  for (let first = 0; first < items.length; first += picturesInOneCall) {
    groups.push(items.slice(first, first + picturesInOneCall));
  }
  return groups;
}

async function callForGroup(options: {
  caller: PictureCaller;
  outputId: string;
  scale: number;
  group: PictureAsk[];
}): Promise<ScenePicture[]> {
  const { group } = options;
  const frames = group.flatMap(({ target }) =>
    target.kind === "frame" ? [target.frame] : [],
  );
  const sceneIds = group.flatMap(({ target }) =>
    target.kind === "scene" ? [target.sceneId] : [],
  );
  const reply = await options.caller.callTool(
    frames.length > 0
      ? {
          name: "preview_frames",
          input: { output_id: options.outputId, frames, scale: options.scale },
        }
      : {
          name: "preview_scenes",
          input: {
            output_id: options.outputId,
            scene_ids: sceneIds,
            scale: options.scale,
          },
        },
  );
  const images = reply.ok && !reply.value.isError ? reply.value.images : [];
  return group.map((...[, index]) => {
    const image = images[index];
    return image === undefined
      ? { kind: "failed" }
      : {
          kind: "ready",
          source: `data:${image.mimeType};base64,${image.base64}`,
        };
  });
}

function keepRecent(store: Map<string, Promise<ScenePicture>>): void {
  for (const key of store.keys()) {
    if (store.size <= keptPictureCount) return;
    store.delete(key);
  }
}

export async function askForPictures(options: {
  caller: PictureCaller;
  outputId: string;
  scale: number;
  asks: PictureAsk[];
}): Promise<Map<string, ScenePicture>> {
  const store = storeOf(options.caller);
  const missing = [
    ...new Map(options.asks.map((ask) => [ask.key, ask])).values(),
  ].filter((ask) => !store.has(ask.key));
  const byKind = [
    missing.filter((ask) => ask.target.kind === "frame"),
    missing.filter((ask) => ask.target.kind === "scene"),
  ];
  for (const group of byKind.flatMap(groupsOf)) {
    const called = callForGroup({ ...options, group });
    group.forEach((...[ask, index]) => {
      const picture = called.then(
        (pictures): ScenePicture => pictures[index] ?? { kind: "failed" },
        (): ScenePicture => ({ kind: "failed" }),
      );
      store.set(ask.key, picture);
      picture
        .then((made) => {
          if (made.kind === "failed" && store.get(ask.key) === picture) {
            store.delete(ask.key);
          }
        })
        .catch(() => undefined);
    });
  }
  keepRecent(store);
  const entries = await Promise.all(
    options.asks.map(
      async (ask) =>
        [ask.key, await (store.get(ask.key) ?? failedPicture)] as const,
    ),
  );
  return new Map(entries);
}
