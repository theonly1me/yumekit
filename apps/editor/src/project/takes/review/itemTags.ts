import type { ShownKind } from "../itemFacts.js";

export const itemTags: Record<ShownKind, readonly string[]> = {
  picture: [
    "Wrong face",
    "Wrong clothes",
    "Bad hands",
    "Wrong place",
    "Bad framing",
    "Style changed",
    "Looks AI-made",
  ],
  clip: [
    "Character changes",
    "Stiff motion",
    "Jump or pop",
    "Bad camera move",
    "Too slow",
    "Does not match its picture",
    "Looks AI-made",
  ],
  music: ["Wrong mood", "Weak start", "No clear hits", "Too busy", "Too plain"],
  cut: [
    "Too long",
    "Off the beat",
    "Jump or pop",
    "Music does not fit",
    "Weak ending",
  ],
  story: [
    "Too plain",
    "Too complex",
    "Weak hero",
    "Weak opponent",
    "Wrong tone",
  ],
};

export const verdictNames = {
  approved: "Looks right",
  change: "Has mistakes",
  question: "Not sure",
  dropped: "Don't use this one",
} as const;
