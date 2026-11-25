export type AssetUse =
  | { kind: "audio-clip"; outputId: string; trackId: string; clipId: string }
  | { kind: "scene"; sceneId: string }
  | { kind: "cast-member"; castId: string }
  | { kind: "project-font"; family: string };

export interface UsesScene {
  id: string;
  source: { props: Readonly<Record<string, unknown>> };
}

export type UsesTrack =
  | {
      kind: "audio";
      id: string;
      clips: readonly { id: string; assetId: string }[];
    }
  | { kind: "scene" };

export interface UsesProject {
  scenes: readonly UsesScene[];
  timelines: readonly { outputId: string; tracks: readonly UsesTrack[] }[];
  cast?: readonly {
    id: string;
    referenceAssetIds: readonly string[];
    looks?: readonly { sheets: readonly { assetId: string }[] }[];
  }[];
  fonts?: readonly { assetId: string; family: string }[];
}

function isAssetKey(key: string): boolean {
  return key.toLowerCase().includes("asset");
}

function namesAsset(options: { value: unknown; assetId: string }): boolean {
  const { value, assetId } = options;
  if (value === assetId) return true;
  return (
    Array.isArray(value) && value.some((item: unknown) => item === assetId)
  );
}

export function propsUseAsset(options: {
  value: unknown;
  assetId: string;
}): boolean {
  const { value, assetId } = options;
  if (Array.isArray(value)) {
    return value.some((item: unknown) =>
      propsUseAsset({ value: item, assetId }),
    );
  }
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).some(
    ([key, inner]) =>
      (isAssetKey(key) && namesAsset({ value: inner, assetId })) ||
      propsUseAsset({ value: inner, assetId }),
  );
}

function audioClipUsesOf(options: {
  project: UsesProject;
  assetId: string;
}): AssetUse[] {
  return options.project.timelines.flatMap((timeline) =>
    timeline.tracks.flatMap((track) =>
      track.kind === "audio"
        ? track.clips
            .filter((clip) => clip.assetId === options.assetId)
            .map((clip) => ({
              kind: "audio-clip" as const,
              outputId: timeline.outputId,
              trackId: track.id,
              clipId: clip.id,
            }))
        : [],
    ),
  );
}

export function assetUsesOf(options: {
  project: UsesProject;
  assetId: string;
}): AssetUse[] {
  const { project, assetId } = options;
  const sceneUses = project.scenes
    .filter((scene) => propsUseAsset({ value: scene.source.props, assetId }))
    .map((scene) => ({ kind: "scene" as const, sceneId: scene.id }));
  const castUses = (project.cast ?? [])
    .filter(
      (member) =>
        member.referenceAssetIds.includes(assetId) ||
        (member.looks ?? []).some((look) =>
          look.sheets.some((sheet) => sheet.assetId === assetId),
        ),
    )
    .map((member) => ({ kind: "cast-member" as const, castId: member.id }));
  const fontUses = (project.fonts ?? [])
    .filter((font) => font.assetId === assetId)
    .map((font) => ({ kind: "project-font" as const, family: font.family }));
  return [
    ...sceneUses,
    ...audioClipUsesOf({ project, assetId }),
    ...castUses,
    ...fontUses,
  ];
}
