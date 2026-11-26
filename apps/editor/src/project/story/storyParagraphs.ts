import type { WholeStory } from "../../parts/story/wholeStorySchema.js";

export interface StoryParagraph {
  key: string;
  label: string;
  text: string;
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function characterTextOf(character: WholeStory["characters"][number]): string {
  return [
    sentence(character.background),
    sentence(`Wants ${character.want}`),
    sentence(`Fears ${character.fear}`),
    sentence(`Does not know: ${character.doesNotKnow}`),
  ].join(" ");
}

export function storyParagraphsOf(story: WholeStory): StoryParagraph[] {
  const force = story.opposingForce;
  return [
    { key: "premise", label: "The premise", text: story.premise },
    {
      key: "world",
      label: "The world",
      text: `${sentence(story.world)} ${sentence(story.worldRule)}`,
    },
    ...story.characters.map((character) => ({
      key: `character-${character.id}`,
      label: character.name,
      text: characterTextOf(character),
    })),
    {
      key: `force-${force.id}`,
      label: force.name,
      text: `${sentence(force.what)} ${sentence(force.why)}`,
    },
    ...story.arc.map((...[step, index]) => ({
      key: `arc-${step.id}`,
      label: `Step ${String(index + 1)} of the arc`,
      text: step.text,
    })),
    { key: "unknown", label: "What stays unknown", text: story.unknownAtEnd },
  ];
}

export function scriptParagraphsOf(script: string): StoryParagraph[] {
  return script
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block !== "")
    .map((...[block, index]) => ({
      key: `script-${String(index)}`,
      label: index === 0 ? "The script" : "",
      text: block,
    }));
}
