import type {
  Asset,
  Edit,
  ProjectSnapshot,
  Scene,
  Timeline,
  Track,
} from "@yumekit/project";

const captionComponent = "caption-words";
const idLengthLimit = 64;

export function uniqueId(options: { base: string; taken: string[] }): string {
  const { base, taken } = options;
  const fitted = base.slice(0, idLengthLimit).replace(/-+$/, "");
  if (!taken.includes(fitted)) return fitted;
  for (let copyNumber = 2; ; copyNumber += 1) {
    const suffix = `-${String(copyNumber)}`;
    const candidate = `${fitted.slice(0, idLengthLimit - suffix.length)}${suffix}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

function isCaptionSceneOf(options: { scene: Scene; assetId: string }): boolean {
  const { source } = options.scene;
  return (
    source.kind === "kit" &&
    source.component === captionComponent &&
    source.props["assetId"] === options.assetId
  );
}

function isCaptionTrack(options: { track: Track; scenes: Scene[] }): boolean {
  const { track, scenes } = options;
  return (
    track.kind === "scene" &&
    track.clips.length > 0 &&
    track.clips.every((clip) =>
      scenes.some(
        (scene) =>
          scene.id === clip.sceneId &&
          scene.source.kind === "kit" &&
          scene.source.component === captionComponent,
      ),
    )
  );
}

export interface NarrationPlan {
  edits: Edit[];
  audioClipId: string;
  captionClipId?: string;
  captionSceneId?: string;
}

export function planNarration(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  asset: Asset & { durationFrames: number };
  startFrame: number;
  withCaptions: boolean;
}): NarrationPlan {
  const { snapshot, timeline, asset, startFrame } = options;
  const trackIds = timeline.tracks.map((track) => track.id);
  const clipIds = timeline.tracks.flatMap((track) =>
    track.clips.map((clip) => clip.id),
  );
  const newTracks: Track[] = [];
  const audioTrack =
    timeline.tracks.find((track) => track.kind === "audio") ??
    ({
      id: uniqueId({ base: "narration", taken: trackIds }),
      kind: "audio",
      clips: [],
    } satisfies Track);
  if (!trackIds.includes(audioTrack.id)) newTracks.push(audioTrack);
  const audioClipId = uniqueId({
    base: `narration-${asset.id}`,
    taken: clipIds,
  });
  const timing = { startFrame, durationFrames: asset.durationFrames };
  const audioEdit: Edit = {
    kind: "addClip",
    outputId: timeline.outputId,
    trackId: audioTrack.id,
    clip: {
      id: audioClipId,
      assetId: asset.id,
      ...timing,
      assetStartFrame: 0,
      gainDecibels: 0,
    },
  };
  if (!options.withCaptions) {
    return {
      edits: [...tracksEdit({ timeline, newTracks }), audioEdit],
      audioClipId,
    };
  }
  const existingScene = snapshot.scenes.find((scene) =>
    isCaptionSceneOf({ scene, assetId: asset.id }),
  );
  const captionSceneId =
    existingScene?.id ??
    uniqueId({
      base: `captions-${asset.id}`,
      taken: snapshot.scenes.map((scene) => scene.id),
    });
  const sceneEdits: Edit[] = existingScene
    ? []
    : [
        {
          kind: "putScene",
          scene: {
            id: captionSceneId,
            title: `Captions of ${asset.id}`,
            notes: "Made by place_narration.",
            source: {
              kind: "kit",
              component: captionComponent,
              props: { assetId: asset.id },
            },
          },
        },
      ];
  const sceneTracks = timeline.tracks.filter((track) => track.kind === "scene");
  const topSceneTrack = sceneTracks.at(-1);
  const captionTrack =
    topSceneTrack &&
    isCaptionTrack({ track: topSceneTrack, scenes: snapshot.scenes })
      ? topSceneTrack
      : ({
          id: uniqueId({
            base: "captions",
            taken: [...trackIds, audioTrack.id],
          }),
          kind: "scene",
          clips: [],
        } satisfies Track);
  if (!trackIds.includes(captionTrack.id)) newTracks.push(captionTrack);
  const captionClipId = uniqueId({
    base: `captions-${asset.id}`,
    taken: [...clipIds, audioClipId],
  });
  const captionEdit: Edit = {
    kind: "addClip",
    outputId: timeline.outputId,
    trackId: captionTrack.id,
    clip: {
      id: captionClipId,
      sceneId: captionSceneId,
      ...timing,
      sceneStartFrame: 0,
    },
  };
  return {
    edits: [
      ...sceneEdits,
      ...tracksEdit({ timeline, newTracks }),
      audioEdit,
      captionEdit,
    ],
    audioClipId,
    captionClipId,
    captionSceneId,
  };
}

function tracksEdit(options: {
  timeline: Timeline;
  newTracks: Track[];
}): Edit[] {
  const { timeline, newTracks } = options;
  if (newTracks.length === 0) return [];
  const sceneTracksAdded = newTracks.filter((track) => track.kind === "scene");
  const audioTracksAdded = newTracks.filter((track) => track.kind === "audio");
  return [
    {
      kind: "setTimeline",
      timeline: {
        outputId: timeline.outputId,
        tracks: [...timeline.tracks, ...sceneTracksAdded, ...audioTracksAdded],
      },
    },
  ];
}
