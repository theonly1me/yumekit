import { join } from "node:path";
import {
  framesPerBeatOf,
  isCalm,
  lookOf,
  tempoGridOf,
  type Asset,
  type ProjectSnapshot,
  type Scene,
} from "@yumekit/project";
import type { StageProject } from "@yumekit/stage";
import type {
  PageFont,
  PageSceneSource,
  StagePageData,
} from "../page/stagePageData.js";
import { assetFramesUrlPrefixOf } from "../videoFrames/videoFrameServer.js";
import type { LoadedOutput } from "./loadOutput.js";

type SceneAsset = StageProject["assets"][string];

export function fileUrlOf(path: string): string {
  return `/@fs${encodeURI(path)}`;
}

async function sceneAssetOf(options: {
  loaded: LoadedOutput;
  asset: Asset;
}): Promise<SceneAsset> {
  const { loaded, asset } = options;
  const words = asset.hasWords
    ? await loaded.store.readAssetWords(asset.id)
    : undefined;
  return {
    url: fileUrlOf(join(loaded.folder, asset.file)),
    kind: asset.kind,
    ...(asset.widthPixels === undefined
      ? {}
      : { widthPixels: asset.widthPixels }),
    ...(asset.heightPixels === undefined
      ? {}
      : { heightPixels: asset.heightPixels }),
    ...(asset.durationFrames === undefined
      ? {}
      : { durationFrames: asset.durationFrames }),
    ...(asset.marks === undefined ? {} : { marks: asset.marks }),
    ...(words?.ok === true ? { words: words.value.words } : {}),
    ...(asset.kind === "video" && asset.durationFrames !== undefined
      ? {
          framePictures: {
            urlPrefix: assetFramesUrlPrefixOf(asset.id),
            count: asset.durationFrames,
          },
        }
      : {}),
  };
}

function sceneSourceOf(options: {
  folder: string;
  scene: Scene;
}): PageSceneSource {
  const { folder, scene } = options;
  return scene.source.kind === "kit"
    ? { kind: "kit", component: scene.source.component }
    : {
        kind: "module",
        file: join(folder, "scenes", scene.id, "scene.tsx"),
      };
}

function pageFontsOf(options: {
  folder: string;
  snapshot: ProjectSnapshot;
}): PageFont[] {
  const { folder, snapshot } = options;
  return (snapshot.project.fonts ?? []).flatMap((font) => {
    const asset = snapshot.assets.find(
      (candidate) => candidate.id === font.assetId,
    );
    return asset === undefined
      ? []
      : [
          {
            family: font.family,
            url: fileUrlOf(join(folder, asset.file)),
            ...(font.weight === undefined
              ? {}
              : { weight: [font.weight].flat().join(" ") }),
            ...(font.style === undefined ? {} : { style: font.style }),
          },
        ];
  });
}

function beatFramesOf(snapshot: ProjectSnapshot): { beatFrames?: number } {
  const grid = tempoGridOf(snapshot.project);
  return grid === undefined ? {} : { beatFrames: framesPerBeatOf(grid) };
}

export async function stagePageDataOf(
  loaded: LoadedOutput,
): Promise<StagePageData> {
  const { snapshot, output, timeline, folder } = loaded;
  const assets = await Promise.all(
    snapshot.assets.map(
      async (asset) =>
        [asset.id, await sceneAssetOf({ loaded, asset })] as const,
    ),
  );
  return {
    look: lookOf(snapshot.project),
    calm: isCalm(snapshot.project),
    fonts: pageFontsOf({ folder, snapshot }),
    project: {
      framesPerSecond: snapshot.project.framesPerSecond,
      ...beatFramesOf(snapshot),
      output: {
        id: output.id,
        widthPixels: output.widthPixels,
        heightPixels: output.heightPixels,
      },
      scenes: snapshot.scenes.map((scene) => ({
        id: scene.id,
        props: scene.source.props,
      })),
      sceneTracks: timeline.tracks.flatMap((track) =>
        track.kind === "scene" ? [track.clips] : [],
      ),
      assets: Object.fromEntries(assets),
    },
    sceneSources: Object.fromEntries(
      snapshot.scenes.map((scene) => [
        scene.id,
        sceneSourceOf({ folder, scene }),
      ]),
    ),
  };
}
