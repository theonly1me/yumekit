import { describe, expect, it } from "vitest";
import { kokoroModel, sizeTextOf } from "./modelFiles.ts";
import { withSpokenNumbers } from "./spokenNumbers.ts";

describe("withSpokenNumbers", () => {
  it.each([
    { text: "Only 3 left.", spoken: "Only three left." },
    { text: "Since 1999.", spoken: "Since nineteen ninety nine." },
    { text: "In 2005.", spoken: "In two thousand five." },
    { text: "1,250 people", spoken: "one thousand two hundred fifty people" },
    { text: "$5.99 today", spoken: "five dollars and ninety nine cents today" },
    { text: "$1", spoken: "one dollar" },
    { text: "Save 30%", spoken: "Save thirty percent" },
    { text: "Our 21st year", spoken: "Our twenty first year" },
    { text: "Version 2.5", spoken: "Version two point five" },
    { text: "The 40th day", spoken: "The fortieth day" },
  ])("says $text as $spoken", ({ text, spoken }) => {
    expect(withSpokenNumbers(text)).toBe(spoken);
  });
});

describe("the natural voice download", () => {
  it("is 148 MB, the sum of its five files", () => {
    expect(sizeTextOf(kokoroModel)).toBe("148 MB");
  });
});
