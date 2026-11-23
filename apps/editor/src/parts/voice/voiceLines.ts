import type { Asset, Scene, SceneClip } from "../../engine/snapshot.js";
import { sceneNameOf } from "../../names/index.js";
import type { AudioTrack } from "../../sound/soundRowFacts.js";

export interface VoiceWindow {
  assetId: string;
  assetStartFrame: number;
  durationFrames: number;
}

export interface VoiceLine {
  clipId: string;
  window: VoiceWindow;
  sceneLabel: string;
  fallbackWords: string;
}

function fallbackWordsOf(asset: Asset | undefined): string {
  if (asset === undefined) return "";
  if (asset.source.kind === "import") {
    return `Your recording ${asset.source.originalName}`;
  }
  const { text } = asset.source.input;
  return typeof text === "string" ? text : "";
}

function windowOf(options: {
  sceneClip: SceneClip;
  voiceClip: AudioTrack["clips"][number];
}): VoiceWindow | undefined {
  const { sceneClip, voiceClip } = options;
  const start = Math.max(sceneClip.startFrame, voiceClip.startFrame);
  const end = Math.min(
    sceneClip.startFrame + sceneClip.durationFrames,
    voiceClip.startFrame + voiceClip.durationFrames,
  );
  if (end <= start) return undefined;
  return {
    assetId: voiceClip.assetId,
    assetStartFrame: voiceClip.assetStartFrame + start - voiceClip.startFrame,
    durationFrames: end - start,
  };
}

export function voiceLinesOf(options: {
  track: AudioTrack | undefined;
  sceneClips: SceneClip[];
  scenes: Scene[];
  assets: Asset[];
}): VoiceLine[] {
  const { track, scenes, assets } = options;
  const voiceClips = [...(track?.clips ?? [])].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
  const hasWords = (assetId: string) =>
    assets.some((asset) => asset.id === assetId && asset.hasWords);
  const wholeClips = voiceClips.filter((clip) => !hasWords(clip.assetId));
  const sceneLines = options.sceneClips.flatMap((...[sceneClip, index]) => {
    const scene = scenes.find(
      (candidate) => candidate.id === sceneClip.sceneId,
    );
    const sceneLabel =
      scene === undefined
        ? `Scene ${String(index + 1)}`
        : `Scene ${String(index + 1)}: ${sceneNameOf({ scene, assets })}`;
    return voiceClips.flatMap((voiceClip): VoiceLine[] => {
      if (!hasWords(voiceClip.assetId)) return [];
      const window = windowOf({ sceneClip, voiceClip });
      if (window === undefined) return [];
      return [
        {
          clipId: `${sceneClip.id}-${voiceClip.id}`,
          window,
          sceneLabel,
          fallbackWords: fallbackWordsOf(
            assets.find((asset) => asset.id === voiceClip.assetId),
          ),
        },
      ];
    });
  });
  return [...wholeLinesOf({ clips: wholeClips, assets }), ...sceneLines];
}

function wholeLinesOf(options: {
  clips: AudioTrack["clips"];
  assets: Asset[];
}): VoiceLine[] {
  return options.clips.map((clip) => ({
    clipId: clip.id,
    window: {
      assetId: clip.assetId,
      assetStartFrame: clip.assetStartFrame,
      durationFrames: clip.durationFrames,
    },
    sceneLabel: "The whole video",
    fallbackWords: fallbackWordsOf(
      options.assets.find((asset) => asset.id === clip.assetId),
    ),
  }));
}
