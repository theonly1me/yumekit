export const captionComponent = "caption-words";

export interface RowScene {
  id: string;
  source: { kind: "kit"; component: string } | { kind: "module" };
}

export type RowTrack =
  { kind: "scene"; clips: readonly { sceneId: string }[] } | { kind: "audio" };

export function isCaptionScene(scene: RowScene | undefined): boolean {
  return (
    scene?.source.kind === "kit" && scene.source.component === captionComponent
  );
}

export function isCaptionTrack(options: {
  track: RowTrack;
  scenes: readonly RowScene[];
}): boolean {
  const { track, scenes } = options;
  return (
    track.kind === "scene" &&
    track.clips.length > 0 &&
    track.clips.every((clip) =>
      isCaptionScene(scenes.find((scene) => scene.id === clip.sceneId)),
    )
  );
}

export function scenesRowOf<TrackType extends RowTrack>(options: {
  tracks: readonly TrackType[];
  scenes: readonly RowScene[];
}): Extract<TrackType, { kind: "scene" }> | undefined {
  return options.tracks.find(
    (track): track is Extract<TrackType, { kind: "scene" }> =>
      track.kind === "scene" &&
      !isCaptionTrack({ track, scenes: options.scenes }),
  );
}
