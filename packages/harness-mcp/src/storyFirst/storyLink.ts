import type { CastMember, Story } from "@yumekit/project";

export function storyLinkNotesOf(options: {
  member: CastMember;
  story: Story | undefined;
}): string[] {
  const { member, story } = options;
  const linked = member.storyCharacterId;
  if (story === undefined || member.kind !== "person") return [];
  const ids = [
    ...story.characters.map((character) => character.id),
    story.opposingForce.id,
  ];
  if (linked === undefined) {
    return [
      `Note: "${member.id}" names no story_character_id. Give the id of the character it shows (${ids.join(", ")}), so its sheet follows the story.`,
    ];
  }
  return ids.includes(linked)
    ? []
    : [
        `Note: story_character_id "${linked}" is not a character of the story. The characters: ${ids.join(", ")}.`,
      ];
}
