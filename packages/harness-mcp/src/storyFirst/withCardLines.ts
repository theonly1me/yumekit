import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ProjectSnapshot } from "@yumekit/project";
import { cardLandingsOf } from "./cardLandings.js";
import { cardNotesOf, cardScenesOf } from "./trailerCards.js";

function cardLinesOf(options: {
  snapshot: ProjectSnapshot;
  sceneIds: readonly string[] | undefined;
  outputId: string | undefined;
}) {
  const { snapshot, sceneIds } = options;
  const isChosen = (sceneId: string) =>
    sceneIds === undefined || sceneIds.includes(sceneId);
  const cards = cardScenesOf(snapshot.scenes).filter((card) =>
    isChosen(card.sceneId),
  );
  const notes = cardNotesOf({ cards, story: snapshot.bible.story });
  const landings = cardLandingsOf({
    snapshot,
    ...(options.outputId === undefined ? {} : { outputId: options.outputId }),
  }).filter((landing) => isChosen(landing.sceneId));
  return { notes, landings };
}

export async function withCardLines(options: {
  result: Promise<CallToolResult> | CallToolResult;
  read: () => ProjectSnapshot;
  sceneIds?: readonly string[];
  outputId?: string;
}): Promise<CallToolResult> {
  const result = await options.result;
  const [first] = result.content;
  if (result.isError === true || first?.type !== "text") return result;
  const { notes, landings } = cardLinesOf({
    snapshot: options.read(),
    sceneIds: options.sceneIds,
    outputId: options.outputId,
  });
  const lines = [...notes, ...landings.map((landing) => landing.line)];
  if (lines.length === 0) return result;
  const data = {
    ...result.structuredContent,
    card_notes: notes,
    card_landings: landings.map((landing) => ({
      scene_id: landing.sceneId,
      clip_id: landing.clipId,
      output_id: landing.outputId,
      lands_at_seconds: landing.landsAtSeconds,
      lands_on: landing.landsOn,
    })),
  };
  return {
    ...result,
    content: [
      { type: "text", text: [first.text, ...lines].join("\n") },
      { type: "text", text: JSON.stringify(data) },
    ],
    structuredContent: data,
  };
}
