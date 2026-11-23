import {
  isCalm,
  lookOf,
  videoStyleOf,
  type ProjectSnapshot,
} from "@yumekit/project";
import { tempoFactsOf } from "../../tempo/beatFacts.js";

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
      return `- ${member.id} (${member.kind}) ${member.name}: ${member.description}${pictures}`;
    }),
  ];
}

export function storyText(snapshot: ProjectSnapshot): string {
  const { project, bible } = snapshot;
  const fonts = (project.fonts ?? [])
    .map((font) => `${font.family} (asset ${font.assetId})`)
    .join(", ");
  return [
    "## Story",
    `Name: ${project.name}. Video style: ${videoStyleOf(project)}. Look: ${lookOf(project)}${isCalm(project) ? ", calm" : ""}.`,
    tempoLine(snapshot),
    `Frame: ${project.frame === undefined ? "none" : `shared code "${project.frame}", drawn over the whole video`}.`,
    `Fonts: ${fonts === "" ? "the fonts of the look" : fonts}.`,
    `Style: ${bible.style === "" ? "none" : bible.style}`,
    `Palette: ${bible.palette.length === 0 ? "the colors of the look" : bible.palette.join(", ")}`,
    `Voice: ${bible.voice === "" ? "none" : bible.voice}`,
    ...castLines(snapshot),
    "### Script",
    snapshot.script.trim() === "" ? "(no script yet)" : snapshot.script.trim(),
  ].join("\n");
}
