import type { Asset, ProjectSnapshot, Scene } from "@yumekit/project";

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
    input: source.input,
    ...(source.costUsd === undefined ? {} : { cost_usd: source.costUsd }),
  };
}

export function wireAssetOf(asset: Asset) {
  return {
    id: asset.id,
    kind: asset.kind,
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
    source: wireSourceOf(asset.source),
  };
}
