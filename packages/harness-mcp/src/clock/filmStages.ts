import type { ProjectSnapshot } from "@yumekit/project";
import { z } from "zod";

export const filmStages = [
  "story",
  "plan",
  "sheets",
  "start-pictures",
  "clips",
  "music",
  "edit",
  "render",
] as const;

export type FilmStage = (typeof filmStages)[number];

export const stageNames: Record<FilmStage, string> = {
  story: "story",
  plan: "plan",
  sheets: "sheets",
  "start-pictures": "start pictures",
  clips: "clips",
  music: "music",
  edit: "edit",
  render: "render",
};

const toolStages: Partial<Record<string, FilmStage>> = {
  set_story: "story",
  set_story_plan: "plan",
  review_plan: "plan",
  review_sheet: "sheets",
  review_start: "start-pictures",
  review_clip: "clips",
  check_music: "music",
  replace_music: "music",
  place_video: "edit",
  place_sound: "edit",
  place_narration: "edit",
  set_timeline: "edit",
  put_work: "edit",
  put_scene: "edit",
  update_clip: "edit",
  set_transitions: "edit",
  contact_sheet: "edit",
  render_video: "render",
};

const requestSchema = z.object({
  capability: z.string().optional(),
  sheet_of: z.string().optional(),
  shot_id: z.string().optional(),
});

const callInputSchema = z.object({
  calls: z.array(requestSchema).optional(),
  reviews: z.array(z.object({ tool: z.string() })).optional(),
  asset_id: z.string().optional(),
  assets: z.array(z.object({ asset_id: z.string() })).optional(),
});

const castInputSchema = z.object({
  reference_asset_ids: z.array(z.unknown()).optional(),
  looks: z
    .array(z.object({ sheets: z.array(z.unknown()).optional() }))
    .optional(),
});

function castStageOf(input: unknown): FilmStage {
  const parsed = castInputSchema.safeParse(input);
  if (!parsed.success) return "plan";
  const { reference_asset_ids, looks } = parsed.data;
  const hasPictures =
    (reference_asset_ids ?? []).length > 0 ||
    (looks ?? []).some((look) => (look.sheets ?? []).length > 0);
  return hasPictures ? "sheets" : "plan";
}

function requestStageOf(input: unknown): FilmStage | undefined {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return undefined;
  const { capability, sheet_of, shot_id } = parsed.data;
  if (sheet_of !== undefined) return "sheets";
  if (capability === "music") return "music";
  if (shot_id === undefined) return undefined;
  if (capability === "image") return "start-pictures";
  return capability === "video" ? "clips" : undefined;
}

export function stageOfCall(options: {
  name: string;
  input: unknown;
  snapshot: ProjectSnapshot;
}): FilmStage | undefined {
  const { name, input, snapshot } = options;
  const byTool = toolStages[name];
  if (byTool !== undefined) return byTool;
  if (name === "generate_asset") return requestStageOf(input);
  if (name === "put_cast_member") return castStageOf(input);
  const parsed = callInputSchema.safeParse(input);
  if (!parsed.success) return undefined;
  const { calls, reviews, asset_id, assets } = parsed.data;
  if (name === "generate_assets") return requestStageOf(calls?.[0]);
  if (name === "review_several") {
    const tool = reviews?.[0]?.tool;
    return tool === undefined ? undefined : toolStages[tool];
  }
  if (name !== "check_design") return undefined;
  const assetId = asset_id ?? assets?.[0]?.asset_id;
  const asset = snapshot.assets.find((candidate) => candidate.id === assetId);
  if (asset === undefined) return undefined;
  return asset.kind === "video" ? "clips" : "start-pictures";
}
