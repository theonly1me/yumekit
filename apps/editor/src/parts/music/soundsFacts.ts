import type { Asset, Snapshot, Timeline } from "../../engine/snapshot.js";
import { audioTracksOf, isSoundsTrack } from "../../sound/soundRowFacts.js";
import { clipAt, mainSceneClipsOf } from "../../timeline/timelineFacts.js";
import type { SoundPiece } from "../sound/useSoundPlayer.js";
import { clockOf } from "./musicFacts.js";
import { assetNameOf } from "../../names/index.js";

export interface SoundPlace {
  outputId: string;
  clipId: string;
}

export interface SoundEntry {
  key: string;
  startFrame: number;
  name: string;
  where: string;
  piece: SoundPiece;
  places: SoundPlace[];
}

function nameOf(options: {
  asset: Asset | undefined;
  assetId: string;
}): string {
  const { asset } = options;
  if (asset === undefined) return "Sound";
  if (asset.source.kind === "import") return asset.source.originalName;
  const { prompt } = asset.source.input;
  return typeof prompt === "string" ? prompt : assetNameOf(asset);
}

function whereOf(options: {
  snapshot: Snapshot;
  timeline: Timeline;
  startFrame: number;
}): string {
  const { snapshot, startFrame } = options;
  const clips = mainSceneClipsOf({
    timeline: options.timeline,
    scenes: snapshot.scenes,
  });
  const scene = clipAt({ clips, frame: startFrame });
  const at = `At ${clockOf(startFrame / snapshot.project.framesPerSecond)}`;
  return scene === undefined
    ? at
    : `${at}, in scene ${String(clips.indexOf(scene) + 1)}`;
}

export function soundEntriesOf(snapshot: Snapshot): SoundEntry[] {
  const framesPerSecond = snapshot.project.framesPerSecond;
  const entries = new Map<string, SoundEntry>();
  for (const timeline of snapshot.timelines) {
    for (const track of audioTracksOf(timeline).filter(isSoundsTrack)) {
      for (const clip of track.clips) {
        const key = `${clip.assetId}@${String(clip.startFrame)}`;
        const place = { outputId: timeline.outputId, clipId: clip.id };
        const known = entries.get(key);
        if (known !== undefined) {
          known.places.push(place);
          continue;
        }
        const asset = snapshot.assets.find((each) => each.id === clip.assetId);
        entries.set(key, {
          key,
          startFrame: clip.startFrame,
          name: nameOf({ asset, assetId: clip.assetId }),
          where: whereOf({ snapshot, timeline, startFrame: clip.startFrame }),
          piece: {
            assetId: clip.assetId,
            startSeconds: clip.assetStartFrame / framesPerSecond,
            lengthSeconds: clip.durationFrames / framesPerSecond,
          },
          places: [place],
        });
      }
    }
  }
  return [...entries.values()].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
}
