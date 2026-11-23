import type {
  Asset,
  Output,
  Scene,
  SceneClip,
  Snapshot,
} from "../../engine/snapshot.js";
import { isVideoScene } from "../../scenes/SceneCards.js";
import { voiceTrackOf } from "../../sound/soundRowFacts.js";
import { timelineOf } from "../../timeline/timelineFacts.js";

export const quietVoiceGainDecibels = -90;

export interface Speaker {
  key: string;
  name: string;
  assetId: string;
  kind: "image" | "video";
}

export interface SceneVoice {
  assetId: string;
  words: string;
  assetStartFrame: number;
  durationFrames: number;
  startSeconds: number;
  lengthSeconds: number;
  leadSeconds: number;
  gainDecibels: number;
}

function isAssetKey(name: string): boolean {
  return /asset/i.test(name);
}

function propAssetIds(options: {
  value: unknown;
  underAssetKey: boolean;
}): string[] {
  const { value, underAssetKey } = options;
  if (typeof value === "string") return underAssetKey ? [value] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      propAssetIds({ value: item, underAssetKey }),
    );
  }
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([name, item]) =>
    propAssetIds({
      value: item,
      underAssetKey: underAssetKey || isAssetKey(name),
    }),
  );
}

function assetOf(options: { assets: Asset[]; assetId: unknown }) {
  return options.assets.find((asset) => asset.id === options.assetId);
}

function sceneSpeakerOf(options: {
  scene: Scene;
  assets: Asset[];
}): Speaker | undefined {
  const { scene, assets } = options;
  if (isVideoScene(scene)) {
    const video = assetOf({ assets, assetId: scene.source.props["assetId"] });
    if (video === undefined) return undefined;
    const input = video.source.kind === "tool" ? video.source.input : {};
    const person = assetOf({ assets, assetId: input["media_asset_id"] });
    if (video.source.kind === "tool" && person !== undefined) {
      return speakerOfAsset({ asset: person, name: "The person of this clip" });
    }
    return speakerOfAsset({ asset: video, name: "The video of this scene" });
  }
  const picture = propAssetIds({
    value: scene.source.props,
    underAssetKey: false,
  })
    .map((assetId) => assetOf({ assets, assetId }))
    .find((asset) => asset?.kind === "image");
  return picture === undefined
    ? undefined
    : speakerOfAsset({ asset: picture, name: "The picture of this scene" });
}

function speakerOfAsset(options: {
  asset: Asset;
  name: string;
}): Speaker | undefined {
  const { asset } = options;
  if (asset.kind !== "image" && asset.kind !== "video") return undefined;
  return {
    key: `scene:${asset.id}`,
    name: options.name,
    assetId: asset.id,
    kind: asset.kind,
  };
}

export function speakersOf(options: {
  snapshot: Snapshot;
  scene: Scene;
}): Speaker[] {
  const { snapshot } = options;
  const { assets } = snapshot;
  const people = snapshot.bible.cast.flatMap((entry) => {
    if (entry.kind !== "person") return [];
    const picture = entry.referenceAssetIds
      .map((assetId) => assetOf({ assets, assetId }))
      .find((asset) => asset?.kind === "image");
    if (picture === undefined) return [];
    return [
      {
        key: `cast:${entry.id}`,
        name: entry.name,
        assetId: picture.id,
        kind: "image" as const,
      },
    ];
  });
  const fromScene = sceneSpeakerOf({ scene: options.scene, assets });
  return fromScene === undefined ? people : [...people, fromScene];
}

function wordsOf(options: {
  asset: Asset | undefined;
  isWholeFile: boolean;
}): string {
  const { asset } = options;
  if (!options.isWholeFile || asset?.source.kind !== "tool") return "";
  const text = asset.source.input["text"];
  return typeof text === "string" ? text : "";
}

export function sceneVoiceOf(options: {
  snapshot: Snapshot;
  output: Output;
  clip: SceneClip;
}): SceneVoice | undefined {
  const { snapshot, clip } = options;
  const { assets } = snapshot;
  const timeline = timelineOf({ snapshot, outputId: options.output.id });
  const track = voiceTrackOf({ timeline, assets });
  const sceneEnd = clip.startFrame + clip.durationFrames;
  const voiceClip = [...(track?.clips ?? [])]
    .sort((...[first, second]) => first.startFrame - second.startFrame)
    .find(
      (candidate) =>
        candidate.startFrame < sceneEnd &&
        candidate.startFrame + candidate.durationFrames > clip.startFrame,
    );
  if (voiceClip === undefined) return undefined;
  const { framesPerSecond } = snapshot.project;
  const startFrame = Math.max(clip.startFrame, voiceClip.startFrame);
  const endFrame = Math.min(
    sceneEnd,
    voiceClip.startFrame + voiceClip.durationFrames,
  );
  const asset = assetOf({ assets, assetId: voiceClip.assetId });
  const assetStartFrame =
    voiceClip.assetStartFrame + startFrame - voiceClip.startFrame;
  const isWholeFile =
    assetStartFrame === 0 && endFrame - startFrame === asset?.durationFrames;
  return {
    assetId: voiceClip.assetId,
    words: wordsOf({ asset, isWholeFile }),
    assetStartFrame,
    durationFrames: endFrame - startFrame,
    startSeconds: assetStartFrame / framesPerSecond,
    lengthSeconds: (endFrame - startFrame) / framesPerSecond,
    leadSeconds: (startFrame - clip.startFrame) / framesPerSecond,
    gainDecibels:
      voiceClip.gainDecibels === quietVoiceGainDecibels
        ? 0
        : voiceClip.gainDecibels,
  };
}
