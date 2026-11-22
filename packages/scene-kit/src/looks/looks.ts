export const lookIds = [
  "midnight",
  "studio",
  "editorial",
  "neon",
  "paper",
] as const;

export type LookId = (typeof lookIds)[number];

export interface Look {
  id: LookId;
  label: string;
  line: string;
}

export const looks: readonly Look[] = [
  {
    id: "midnight",
    label: "Midnight",
    line: "Deep night blue with two soft glows that drift, bright text, and warm accents. Reads as a modern product video.",
  },
  {
    id: "studio",
    label: "Studio",
    line: "Clean white with black text and strong primary accents. Reads as a sharp explainer.",
  },
  {
    id: "editorial",
    label: "Editorial",
    line: "Warm cream with fine grain, a serif headline font, and earth accents. Reads as a magazine.",
  },
  {
    id: "neon",
    label: "Neon",
    line: "Black with a grid that moves toward the viewer, and lime and cyan accents. Reads as tech and games.",
  },
  {
    id: "paper",
    label: "Paper",
    line: "Pale paper with round friendly fonts and soft pastel accents. Calm, like a slide.",
  },
];

export function isLookId(value: unknown): value is LookId {
  return lookIds.some((lookId) => lookId === value);
}
