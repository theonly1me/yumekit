import {
  isCalm,
  lookOf,
  videoStyleOf,
  type ProjectSnapshot,
} from "@yumekit/project";
import { tempoFactsOf } from "../../tempo/beatFacts.js";
import { storyWorkLines } from "../../storyFirst/storyLines.js";
import { planLines } from "./planText.js";

function tempoLine(snapshot: ProjectSnapshot): string {
  const { tempo, frames_per_beat } = tempoFactsOf(snapshot.project);
  const framesPerSecond = String(snapshot.project.framesPerSecond);
  return tempo === null
    ? `Time: ${framesPerSecond} frames each second. No tempo (set_tempo adds one).`
    : `Time: ${framesPerSecond} frames each second. Tempo ${String(tempo)} beats each minute, ${String(frames_per_beat)} frames each beat, 4 beats each bar.`;
}

function castLines(snapshot: ProjectSnapshot): string[] {
  const { cast } = snapshot.bible;
  if (cast.length === 0) return ["Cast: none."];
  return [
    "Cast:",
    ...cast.map((member) => {
      const pictures =
        member.referenceAssetIds.length === 0
          ? ""
          : ` Pictures: ${member.referenceAssetIds.join(", ")}.`;
      const facts =
        (member.facts ?? []).length === 0
          ? ""
          : ` Fixed: ${(member.facts ?? []).join("; ")}.`;
      const review = member.sheetReview;
      const checked =
        review === undefined
          ? " Sheet not checked by the critic."
          : ` Sheet ${review.verdict === "pass" ? "passed" : `failed: ${review.faults.join("; ")}`}.${(review.notes ?? []).length === 0 ? "" : ` Notes: ${(review.notes ?? []).join("; ")}.`}`;
      const restrictions =
        (member.restrictions ?? []).length === 0
          ? ""
          : ` Restrictions: ${(member.restrictions ?? []).join("; ")}.`;
      const prompts = (member.sheetPrompts ?? []).length;
      const planned =
        prompts === 0 ? "" : ` Sheet prompts: ${String(prompts)}.`;
      const character =
        member.storyCharacterId === undefined
          ? ""
          : ` Story character: ${member.storyCharacterId}.`;
      return `- ${member.id} (${member.kind}) ${member.name}: ${member.description}${character}${facts}${pictures}${checked}${restrictions}${planned}`;
    }),
  ];
}

function ownLookLine(project: ProjectSnapshot["project"]): string {
  const colors =
    project.lookColors === undefined
      ? "the colors of the look"
      : `background ${project.lookColors.background}, text ${project.lookColors.text}, muted ${project.lookColors.muted}, accent ${project.lookColors.accent}`;
  return `Kit scene colors: ${colors}. Kit scene font: ${project.lookFont ?? "the fonts of the look"}.`;
}

export function storyText(snapshot: ProjectSnapshot): string {
  const { project, bible } = snapshot;
  const fonts = (project.fonts ?? [])
    .map((font) => `${font.family} (asset ${font.assetId})`)
    .join(", ");
  return [
    "## Story",
    `Name: ${project.name}. Video style: ${videoStyleOf(project)}. Look: ${lookOf(project)}${isCalm(project) ? ", calm" : ""}.`,
    ownLookLine(project),
    tempoLine(snapshot),
    `Frame: ${project.frame === undefined ? "none" : `shared code "${project.frame}", drawn over the whole video`}.`,
    `Fonts: ${fonts === "" ? "the fonts of the look" : fonts}.`,
    `Style (the art direction of each picture and clip): ${bible.style === "" ? "none" : bible.style}`,
    `Palette: ${bible.palette.length === 0 ? "the colors of the look" : bible.palette.join(", ")}`,
    `Voice: ${bible.voice === "" ? "none" : bible.voice}`,
    ...storyWorkLines(snapshot),
    ...castLines(snapshot),
    ...planLines(snapshot),
    "### Script",
    snapshot.script.trim() === "" ? "(no script yet)" : snapshot.script.trim(),
  ].join("\n");
}
