import { describe, expect, it } from "vitest";
import { z } from "zod";
import { kitSceneSchemas } from "../schemas.js";

function undescribedFields(options: {
  path: string;
  schema: z.core.$ZodType;
}): string[] {
  const { path, schema } = options;
  const inner = schema instanceof z.ZodOptional ? schema.unwrap() : schema;
  const own =
    z.globalRegistry.get(schema)?.description === undefined ? [path] : [];
  if (inner instanceof z.ZodArray) {
    return [
      ...own,
      ...undescribedFields({ path: `${path}[]`, schema: inner.element }),
    ];
  }
  if (inner instanceof z.ZodObject) {
    return [...own, ...fieldsOf({ path, shape: inner.shape })];
  }
  return own;
}

function fieldsOf(options: { path: string; shape: z.core.$ZodShape }) {
  return Object.entries(options.shape).flatMap(([key, field]) =>
    undescribedFields({ path: `${options.path}.${key}`, schema: field }),
  );
}

describe("kitSceneSchemas", () => {
  it("lists the twenty-six kit scenes of the design", () => {
    expect(Object.keys(kitSceneSchemas)).toEqual([
      "title-card",
      "bullet-list",
      "image-pan",
      "caption-words",
      "bar-chart",
      "quote",
      "video-clip",
      "hero",
      "stat",
      "compare",
      "steps",
      "chat",
      "device",
      "split",
      "logo-reveal",
      "checklist",
      "end-card",
      "lower-third",
      "kinetic",
      "footage",
      "wall",
      "shapes",
      "lines",
      "look-swap",
      "command",
      "counts",
    ]);
  });

  it("gives each scene a purpose and a description for every prop", () => {
    const missing = Object.entries(kitSceneSchemas).flatMap(([name, entry]) => [
      ...(entry.purpose.length > 20 ? [] : [`${name} purpose`]),
      ...fieldsOf({ path: name, shape: entry.props.shape }),
    ]);
    expect(missing).toEqual([]);
  });

  it("accepts typical props and rejects a prop with a wrong type", () => {
    const titleCard = kitSceneSchemas["title-card"].props;
    expect(titleCard.safeParse({ heading: "Hello" }).success).toBe(true);
    expect(titleCard.safeParse({ heading: 3 }).success).toBe(false);
    expect(titleCard.safeParse({ title: "Typo" }).success).toBe(false);
    const barChart = kitSceneSchemas["bar-chart"].props;
    expect(
      barChart.safeParse({ bars: [{ label: "A", value: 2 }] }).success,
    ).toBe(true);
    expect(barChart.safeParse({ bars: [] }).success).toBe(false);
  });

  it("converts each props schema to JSON Schema for the harness", () => {
    for (const entry of Object.values(kitSceneSchemas)) {
      expect(z.toJSONSchema(entry.props)).toHaveProperty("properties");
    }
  });

  it("names the asset kind of each asset id prop in the JSON Schema", () => {
    const assetKinds = Object.entries(kitSceneSchemas).flatMap(
      ([name, entry]) => {
        const assetId: unknown = z.toJSONSchema(entry.props).properties?.[
          "assetId"
        ];
        if (typeof assetId !== "object" || assetId === null) return [];
        if ("assetKind" in assetId) return [[name, assetId.assetKind]];
        return "assetKinds" in assetId ? [[name, assetId.assetKinds]] : [];
      },
    );
    expect(assetKinds).toEqual([
      ["image-pan", "image"],
      ["caption-words", "audio"],
      ["video-clip", "video"],
      ["device", ["image", "video"]],
      ["split", ["image", "video"]],
      ["logo-reveal", "image"],
      ["kinetic", "audio"],
      ["footage", ["video", "image"]],
    ]);
  });
});
