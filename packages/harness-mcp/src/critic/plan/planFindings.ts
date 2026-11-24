import type { CastMember } from "@yumekit/project";

const bareNumber =
  /\b(twice|three times|half as|\d+(\.\d+)?\s*(x|times|%|percent|cm|m|meters?|feet|ft|inches)|(half a|a|one|two|three|\d+) heads?( and a half)? (taller|shorter|higher|lower)|a (little|bit|lot) (taller|shorter|bigger|smaller|wider|narrower))\b/i;

const partWords: { part: string; words: RegExp }[] = [
  {
    part: "a garment",
    words:
      /\b(coat|jacket|kimono|robes?|shirt|trousers|pants|hakama|haori|dress|cloak|sash|armou?r|boots|sandals|socks|hat|scarf|vest|skirt|gloves|tunic|cape|uniform|apron|hood)\b/i,
  },
  { part: "the hair", words: /\b(hair|bald|braid|ponytail)\b/i },
  { part: "the face", words: /\b(face|eyes?|nose|mouth|jaw|brows?)\b/i },
  {
    part: "what it must not resemble",
    words:
      /\b(not resemble|not look like|never look like|must not|no (buttons?|badge|uniform|standing collar|logo|crest|emblem))\b/i,
  },
];

export interface PlanFinding {
  text: string;
}

function numberFindings(members: CastMember[]): PlanFinding[] {
  return members.flatMap((member) =>
    [member.description, ...(member.facts ?? [])]
      .filter((sentence) => bareNumber.test(sentence))
      .map((sentence) => ({
        text: `"${member.id}" gives a size as a number or a ratio, which no picture can match: "${sentence}". A fact is a visual statement, for example "side by side, the top of the hero's head reaches its chest".`,
      })),
  );
}

function thinFindings(members: CastMember[]): PlanFinding[] {
  return members
    .filter((member) => member.kind === "person")
    .flatMap((member) => {
      const words = [member.description, ...(member.facts ?? [])].join(" ");
      const missing = partWords
        .filter((entry) => !entry.words.test(words))
        .map((entry) => entry.part);
      return missing.length === 0
        ? []
        : [
            {
              text: `"${member.id}" does not name ${missing.join(", ")}. A thin description lets the model borrow a known design.`,
            },
          ];
    });
}

export function planFindingsOf(members: CastMember[]): PlanFinding[] {
  return [...numberFindings(members), ...thinFindings(members)];
}
