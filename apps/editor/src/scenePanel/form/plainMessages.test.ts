import { describe, expect, it } from "vitest";
import { isNumberText, typedNumberOf } from "./NumberField.js";
import { plainIssue } from "./plainMessages.js";
import type { PropSchema } from "./propSchema.js";
import type { JsonObject } from "./propPath.js";

const schema: PropSchema = {
  type: "object",
  required: ["heading", "share", "count", "bars"],
  properties: {
    heading: { type: "string", minLength: 1, maxLength: 5 },
    share: { type: "number", minimum: 0, maximum: 100 },
    start: { type: "number", minimum: 0 },
    end: { type: "number", maximum: 10 },
    count: { type: "integer" },
    direction: { type: "string", enum: ["left", "right"] },
    bars: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string", minLength: 1 },
    },
  },
};

function wordOf(options: { path: (string | number)[]; props: JsonObject }) {
  return plainIssue({
    issue: { path: options.path, message: "Invalid input from the tool" },
    schema,
    props: options.props,
  }).message;
}

describe("plainIssue", () => {
  it.each([
    [["heading"], { heading: "" }, "Give at least 1 character"],
    [["heading"], { heading: "Too long" }, "Use at most 5 characters"],
    [["share"], { share: 140 }, "Use a number from 0 to 100"],
    [["share"], { share: "" }, "Use a number from 0 to 100"],
    [["start"], { start: -1 }, "Use a number of 0 or more"],
    [["end"], { end: 11 }, "Use a number of 10 or less"],
    [["count"], { count: 1.5 }, "Use a whole number"],
    [["count"], {}, "Fill in this field"],
    [["direction"], { direction: "up" }, "Choose one of left, right"],
    [["bars"], { bars: [] }, "Add at least 1 item"],
    [["bars"], { bars: ["a", "b", "c"] }, "Use at most 2 items"],
    [["bars", 0], { bars: [""] }, "Give at least 1 character"],
    [["heading"], { heading: 4 }, "Give a text"],
  ])("words the failure at %j of %j as %s", (...[path, props, expected]) => {
    expect(wordOf({ path, props })).toBe(expected);
  });

  it("keeps the tool message for a failure it does not map", () => {
    expect(
      plainIssue({
        issue: { path: ["unknown"], message: "Remove the prop unknown." },
        schema,
        props: { unknown: 1 },
      }).message,
    ).toBe("Remove the prop unknown.");
  });

  it("never shows the words of the schema library", () => {
    expect(
      plainIssue({
        issue: {
          path: [],
          message: "Invalid input: expected string, received number",
        },
        schema,
        props: {},
      }).message,
    ).toBe("This value does not fit this field.");
  });
});

describe("number text", () => {
  it("accepts digits, one minus sign at the start, and one decimal point", () => {
    expect(isNumberText({ text: "-12.5", isInteger: false })).toBe(true);
    expect(isNumberText({ text: "1e5", isInteger: false })).toBe(false);
    expect(isNumberText({ text: "ten", isInteger: false })).toBe(false);
    expect(isNumberText({ text: "1-2", isInteger: false })).toBe(false);
    expect(isNumberText({ text: "1.2.3", isInteger: false })).toBe(false);
  });

  it("accepts whole numbers only for an integer prop", () => {
    expect(isNumberText({ text: "-12", isInteger: true })).toBe(true);
    expect(isNumberText({ text: "1.5", isInteger: true })).toBe(false);
  });

  it("keeps the empty state of an optional prop and waits for an unfinished number", () => {
    expect(typedNumberOf({ text: "", isRequired: false })).toEqual({
      kind: "value",
      value: undefined,
    });
    expect(typedNumberOf({ text: "-", isRequired: true })).toEqual({
      kind: "unfinished",
    });
    expect(typedNumberOf({ text: "2.", isRequired: true })).toEqual({
      kind: "value",
      value: 2,
    });
  });
});
