import {
  assetLabelOf,
  type Asset,
  type ProjectSnapshot,
  type Scene,
} from "@yumekit/project";
import { wireMarkOf } from "./media/markInputs.js";

export function wireSceneOf(options: {
  scene: Scene;
  snapshot: ProjectSnapshot;
}) {
  const { scene, snapshot } = options;
  const common = { id: scene.id, title: scene.title, notes: scene.notes };
  if (scene.source.kind === "kit") {
    return {
      ...common,
      kind: "kit",
      kit_component: scene.source.component,
      props: scene.source.props,
    };
  }
  return {
    ...common,
    kind: "module",
    props: scene.source.props,
    code: snapshot.sceneCode[scene.id] ?? "",
  };
}

function wireSourceOf(source: Asset["source"]) {
  if (source.kind === "import") {
    return { kind: source.kind, original_name: source.originalName };
  }
  return {
    kind: source.kind,
    server: source.server,
    tool: source.tool,
    ...(source.model === undefined ? {} : { model: source.model }),
    input: source.input,
    ...(source.costUsd === undefined ? {} : { cost_usd: source.costUsd }),
    ...(source.costIsEstimate === undefined
      ? {}
      : { cost_is_estimate: source.costIsEstimate }),
  };
}

export function wireAssetOf(asset: Asset) {
  return {
    id: asset.id,
    kind: asset.kind,
    label: assetLabelOf(asset),
    file: asset.file,
    ...(asset.widthPixels === undefined
      ? {}
      : { width_pixels: asset.widthPixels }),
    ...(asset.heightPixels === undefined
      ? {}
      : { height_pixels: asset.heightPixels }),
    ...(asset.durationFrames === undefined
      ? {}
      : { duration_frames: asset.durationFrames }),
    has_words: asset.hasWords,
    ...(asset.hasAudio === undefined ? {} : { has_audio: asset.hasAudio }),
    ...(asset.marks === undefined
      ? {}
      : { marks: asset.marks.map(wireMarkOf) }),
    source: wireSourceOf(asset.source),
  };
}
