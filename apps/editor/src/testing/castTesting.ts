import { z } from "zod";
import { engineRequest } from "./mediaTestTools.js";
import type { RunningEngine } from "./runEngine.js";

export const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const castSchema = z.object({
  bible: z.object({
    cast: z.array(
      z.object({
        id: z.string(),
        kind: z.string(),
        name: z.string(),
        description: z.string(),
        referenceAssetIds: z.array(z.string()),
      }),
    ),
  }),
});

export async function castOf(engine: RunningEngine) {
  const project = castSchema.parse(
    await engineRequest({ engine, path: "/api/project" }),
  );
  return project.bible.cast;
}
