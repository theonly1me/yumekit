import {
  storyPartIdsOf,
  type JsonObject,
  type Scene,
  type Story,
} from "@yumekit/project";

export const trailerCardComponent = "trailer-card";

export interface CardScene {
  sceneId: string;
  lines: string[];
  storyFact: string | undefined;
  landsOnBeat: number;
}

function linesOf(props: JsonObject): string[] {
  const lines = props["lines"];
  return Array.isArray(lines)
    ? lines.filter((line) => typeof line === "string")
    : [];
}

export function cardScenesOf(scenes: readonly Scene[]): CardScene[] {
  return scenes.flatMap((scene) => {
    const { source } = scene;
    if (source.kind !== "kit" || source.component !== trailerCardComponent) {
      return [];
    }
    const storyFact = source.props["storyFact"];
    const landsOnBeat = source.props["landsOnBeat"];
    return [
      {
        sceneId: scene.id,
        lines: linesOf(source.props),
        storyFact:
          typeof storyFact === "string" && storyFact !== ""
            ? storyFact
            : undefined,
        landsOnBeat: typeof landsOnBeat === "number" ? landsOnBeat : 0,
      },
    ];
  });
}

export function storyPartIdsLine(story: Story): string {
  return storyPartIdsOf(story).join(", ");
}

export function cardNotesOf(options: {
  cards: CardScene[];
  story: Story | undefined;
}): string[] {
  const { story } = options;
  const known = new Set(story === undefined ? [] : storyPartIdsOf(story));
  return options.cards.flatMap((card) => {
    const words = `"${card.lines.join(" / ")}"`;
    if (story === undefined) {
      return [
        `Note: card "${card.sceneId}" (${words}) has no story behind it. Each word on screen comes from the story: write it with set_story, then give the card the storyFact of the part that it says.`,
      ];
    }
    if (card.storyFact === undefined) {
      return [
        `Note: card "${card.sceneId}" (${words}) names no storyFact. Each word on screen comes from the story: give the id of the part that it says (${storyPartIdsLine(story)}). A line is right when it could belong to this story only.`,
      ];
    }
    if (!known.has(card.storyFact)) {
      return [
        `Note: card "${card.sceneId}" names storyFact "${card.storyFact}", which is not a part of the story. The parts: ${storyPartIdsLine(story)}.`,
      ];
    }
    return [];
  });
}
