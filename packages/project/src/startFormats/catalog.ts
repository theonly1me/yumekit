import {
  explainerDirection,
  listDirection,
  newsDirection,
  productAdDirection,
  quoteDirection,
  storyDirection,
  talkingHeadDirection,
} from "./directions.js";

export const startFormatIds = [
  "free",
  "explainer",
  "product-ad",
  "story",
  "talking-head",
  "list",
  "quote",
  "news",
] as const;

export type StartFormatId = (typeof startFormatIds)[number];

export interface StartFormat {
  id: StartFormatId;
  name: string;
  line: string;
  direction: string;
}

const startFormatsById: Record<StartFormatId, Omit<StartFormat, "id">> = {
  free: {
    name: "No format",
    line: "The AI picks the structure from your words.",
    direction: "",
  },
  explainer: {
    name: "Explainer",
    line: "Explains one idea, step by step.",
    direction: explainerDirection,
  },
  "product-ad": {
    name: "Product ad",
    line: "Sells one product in a short, fast ad.",
    direction: productAdDirection,
  },
  story: {
    name: "Story",
    line: "Tells a short story with a turn.",
    direction: storyDirection,
  },
  "talking-head": {
    name: "Talking head",
    line: "One person speaks to the viewer.",
    direction: talkingHeadDirection,
  },
  list: {
    name: "5 tips",
    line: "A numbered list of five tips.",
    direction: listDirection,
  },
  quote: {
    name: "Quote",
    line: "One strong quote, with room to read it.",
    direction: quoteDirection,
  },
  news: {
    name: "News",
    line: "A short news update with the facts.",
    direction: newsDirection,
  },
};

export const firstStartFormatId: StartFormatId = "free";

export const planFirstSentence =
  "Stop after the script and the pictures of each scene, drawn by code. Make no voice, no music, and no paid clip yet. Ask me to continue.";

export function startFormatOf(id: StartFormatId): StartFormat {
  return { id, ...startFormatsById[id] };
}

export const startFormatCatalog: readonly StartFormat[] =
  startFormatIds.map(startFormatOf);

export function isStartFormatId(value: string): value is StartFormatId {
  return startFormatIds.some((id) => id === value);
}
