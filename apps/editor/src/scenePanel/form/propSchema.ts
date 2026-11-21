import { z } from "zod";

export const assetKinds = ["image", "audio", "video"] as const;

export type AssetKind = (typeof assetKinds)[number];

export interface PropSchema {
  type?: string | undefined;
  enum?: string[] | undefined;
  maxLength?: number | undefined;
  maxItems?: number | undefined;
  assetKind?: AssetKind | undefined;
  items?: PropSchema | undefined;
  properties?: Record<string, PropSchema> | undefined;
  required?: string[] | undefined;
}

export const propSchemaSchema: z.ZodType<PropSchema> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    enum: z.array(z.string()).optional(),
    maxLength: z.number().optional(),
    maxItems: z.number().optional(),
    assetKind: z.enum(assetKinds).optional(),
    items: propSchemaSchema.optional(),
    properties: z.record(z.string(), propSchemaSchema).optional(),
    required: z.array(z.string()).optional(),
  }),
);

export const kitScenesSchema = z.object({
  kit_scenes: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      props: propSchemaSchema,
    }),
  ),
});

export type KitScenes = z.infer<typeof kitScenesSchema>["kit_scenes"];
