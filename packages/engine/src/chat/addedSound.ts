import { assetLabelOf, type ProjectSnapshot } from "@yumekit/project";
import { z } from "zod";

const timelineInputSchema = z.looseObject({
  tracks: z.array(
    z.looseObject({
      id: z.string(),
      kind: z.string(),
      clips: z.array(z.looseObject({ asset_id: z.string().optional() })),
    }),
  ),
});

const voiceTrackPattern = /^(narration|voice)(-\d+)?$/;
const soundsTrackPattern = /^sounds(-\d+)?$/;

function roleOf(trackId: string): string {
  if (voiceTrackPattern.test(trackId)) return "the voice";
  if (soundsTrackPattern.test(trackId)) return "the sound";
  return "the music";
}

export function addedSoundSentenceOf(options: {
  tool: string;
  input: Readonly<Record<string, unknown>>;
  snapshot: ProjectSnapshot;
}): string | undefined {
  if (options.tool !== "set_timeline") return undefined;
  const parsed = timelineInputSchema.safeParse(options.input);
  if (!parsed.success) return undefined;
  const { snapshot } = options;
  const placed = new Set(
    snapshot.timelines.flatMap((timeline) =>
      timeline.tracks.flatMap((track) =>
        track.kind === "audio" ? track.clips.map((clip) => clip.assetId) : [],
      ),
    ),
  );
  for (const track of parsed.data.tracks) {
    if (track.kind !== "audio") continue;
    const added = track.clips.find(
      (clip) => clip.asset_id !== undefined && !placed.has(clip.asset_id),
    );
    const asset = snapshot.assets.find(
      (candidate) => candidate.id === added?.asset_id,
    );
    if (asset !== undefined) {
      return `You added ${roleOf(track.id)} ${assetLabelOf(asset)}.`;
    }
  }
  return undefined;
}
