import { z } from "zod";

export const castKinds = ["person", "place", "product", "prop"] as const;

export type CastKind = (typeof castKinds)[number];

export const castKindLabels: Record<CastKind, string> = {
  person: "Person",
  place: "Place",
  product: "Product",
  prop: "Prop",
};

const designCheckSchema = z.object({
  assetId: z.string(),
  breaks: z.array(z.string()),
  cleanUntilSeconds: z.number().optional(),
  personKept: z.object({ words: z.string() }).optional(),
});

export const castLookSchema = z.object({
  id: z.string(),
  name: z.string(),
  clothes: z.array(z.string()),
  props: z.array(
    z.object({ name: z.string(), count: z.number(), side: z.string() }),
  ),
  sheets: z.array(
    z.object({
      assetId: z.string(),
      kind: z.string(),
      poses: z.array(z.string()).optional(),
      check: designCheckSchema.optional(),
    }),
  ),
  personAsked: z.object({ words: z.string() }).optional(),
});

export type CastLookEntry = z.infer<typeof castLookSchema>;

export { designCheckSchema };

export const castEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(castKinds),
  name: z.string(),
  description: z.string(),
  facts: z.array(z.string()).optional(),
  referenceAssetIds: z.array(z.string()),
  sheetReview: z
    .object({
      verdict: z.enum(["pass", "fail"]),
      faults: z.array(z.string()),
      assetIds: z.array(z.string()),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
  sheetTries: z
    .array(
      z.object({
        assetIds: z.array(z.string()),
        verdict: z.enum(["pass", "fail"]),
      }),
    )
    .optional(),
  restrictions: z.array(z.string()).optional(),
  briefFacts: z.array(z.string()).optional(),
  storyCharacterId: z.string().optional(),
  looks: z.array(castLookSchema).optional(),
});

export type CastEntry = z.infer<typeof castEntrySchema>;

export const maximumPictures = 4;

const idLimit = 60;

export function newCastIdOf(options: {
  name: string;
  entries: CastEntry[];
}): string {
  const cleaned = options.name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, idLimit);
  const base = cleaned === "" ? "entry" : cleaned;
  const taken = new Set(options.entries.map((entry) => entry.id));
  let candidate = base;
  for (let suffix = 2; taken.has(candidate); suffix += 1) {
    candidate = `${base}-${String(suffix)}`;
  }
  return candidate;
}
