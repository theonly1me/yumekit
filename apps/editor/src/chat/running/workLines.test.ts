import { describe, expect, it } from "vitest";
import { clockOf, workLinesOf } from "./workLines.js";

const startedAt = "2026-11-25T10:00:00.000Z";
const now = Date.parse("2026-11-25T10:01:05.000Z");

describe("the lines of the work that runs now", () => {
  it("gives each running call its shot, its service, its state, and its time", () => {
    const lines = workLinesOf({
      now,
      items: [
        {
          id: "walk-start",
          kind: "media",
          what: "a picture",
          subject: "walk-start",
          shotId: "walk",
          server: "gemini",
          state: "running",
          startedAt,
        },
        {
          id: "crawl-start",
          kind: "media",
          what: "a picture",
          subject: "crawl-start",
          shotId: "crawl",
          server: "gemini",
          state: "waiting",
          startedAt,
        },
        {
          id: "sheet:hero",
          kind: "review",
          what: "a sheet review",
          subject: 'the sheet of "hero"',
          castId: "hero",
          state: "running",
          startedAt,
        },
      ],
    });

    expect(lines).toEqual([
      {
        key: "media:walk-start",
        text: 'A picture of shot "walk"',
        service: "gemini",
        state: "running",
        seconds: 65,
      },
      {
        key: "media:crawl-start",
        text: 'A picture of shot "crawl"',
        service: "gemini",
        state: "waiting",
        seconds: 65,
      },
      {
        key: "review:sheet:hero",
        text: 'A sheet review for "hero"',
        service: "the critic",
        state: "running",
        seconds: 65,
      },
    ]);
    expect(clockOf(65)).toBe("1:05");
  });
});
