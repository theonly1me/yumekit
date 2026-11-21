import { describe, expect, it } from "vitest";
import { fieldsOf } from "./fields.js";

describe("fieldsOf", () => {
  it("makes a field of each kind from a props schema", () => {
    const fields = fieldsOf({
      type: "object",
      required: ["heading", "bars"],
      properties: {
        heading: { type: "string", maxLength: 120 },
        quote: { type: "string", maxLength: 300 },
        startSeconds: { type: "number" },
        direction: { type: "string", enum: ["left", "right"] },
        isMuted: { type: "boolean" },
        assetId: { type: "string", assetKind: "video" },
        items: { type: "array", maxItems: 6, items: { type: "string" } },
        bars: {
          type: "array",
          items: {
            type: "object",
            required: ["value"],
            properties: { value: { type: "number" } },
          },
        },
        focus: { type: "object", properties: { x: { type: "number" } } },
        unknownShape: { type: "null" },
      },
    });

    expect(
      fields.map((field) => [field.name, field.kind, field.label]),
    ).toEqual([
      ["heading", "text", "Heading"],
      ["quote", "text", "Quote"],
      ["startSeconds", "number", "Start seconds"],
      ["direction", "choice", "Direction"],
      ["isMuted", "switch", "Is muted"],
      ["assetId", "asset", "Video"],
      ["items", "text-list", "Items"],
      ["bars", "object-list", "Bars"],
      ["focus", "group", "Focus"],
    ]);
    expect(fields.map((field) => field.isRequired)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it("shows a string that allows more than 200 characters as long text", () => {
    const [short, long, unlimited] = fieldsOf({
      type: "object",
      properties: {
        short: { type: "string", maxLength: 200 },
        long: { type: "string", maxLength: 201 },
        unlimited: { type: "string" },
      },
    });

    expect([short, long, unlimited]).toMatchObject([
      { isLong: false },
      { isLong: true },
      { isLong: true },
    ]);
  });

  it("names a list item with the singular of the list name", () => {
    const [bars] = fieldsOf({
      type: "object",
      properties: {
        bars: {
          type: "array",
          maxItems: 8,
          items: { type: "object", properties: {} },
        },
      },
    });

    expect(bars).toMatchObject({ itemLabel: "Bar", maxItems: 8 });
  });
});
