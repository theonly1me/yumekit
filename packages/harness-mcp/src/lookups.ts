import type {
  Asset,
  Output,
  ProjectSnapshot,
  Scene,
  Timeline,
} from "@yumekit/project";
import type { HarnessFailure, Outcome } from "./results.js";

function idList(ids: string[]): string {
  return ids.length === 0 ? "none" : ids.join(", ");
}

export function findOutput(options: {
  snapshot: ProjectSnapshot;
  outputId: string;
}): Outcome<{ output: Output; timeline: Timeline }, HarnessFailure> {
  const { snapshot, outputId } = options;
  const output = snapshot.project.outputs.find(
    (candidate) => candidate.id === outputId,
  );
  const timeline = snapshot.timelines.find(
    (candidate) => candidate.outputId === outputId,
  );
  if (output === undefined || timeline === undefined) {
    return {
      ok: false,
      failure: {
        kind: "output-not-found",
        message: `The project has no output "${outputId}".`,
        hint: `Use one of these output ids: ${idList(snapshot.project.outputs.map((candidate) => candidate.id))}. Or add an output with add_output.`,
      },
    };
  }
  return { ok: true, value: { output, timeline } };
}

export function findScene(options: {
  snapshot: ProjectSnapshot;
  sceneId: string;
}): Outcome<Scene, HarnessFailure> {
  const { snapshot, sceneId } = options;
  const scene = snapshot.scenes.find((candidate) => candidate.id === sceneId);
  return scene === undefined
    ? {
        ok: false,
        failure: {
          kind: "scene-not-found",
          message: `The project has no scene "${sceneId}".`,
          hint: `Use one of these scene ids: ${idList(snapshot.scenes.map((candidate) => candidate.id))}. Or add the scene with put_scene.`,
        },
      }
    : { ok: true, value: scene };
}

export function findAsset(options: {
  snapshot: ProjectSnapshot;
  assetId: string;
}): Outcome<Asset, HarnessFailure> {
  const { snapshot, assetId } = options;
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  return asset === undefined
    ? {
        ok: false,
        failure: {
          kind: "asset-not-found",
          message: `The project has no asset "${assetId}".`,
          hint: `Use one of these asset ids: ${idList(snapshot.assets.map((candidate) => candidate.id))}. Or make the asset with generate_asset or import_asset.`,
        },
      }
    : { ok: true, value: asset };
}
