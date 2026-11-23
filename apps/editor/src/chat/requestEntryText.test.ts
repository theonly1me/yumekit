import { describe, expect, it } from "vitest";
import { fullRequestTextOf, shownRequestTextOf } from "./requestEntryText.js";

describe("the text of a request in the chat", () => {
  it("shows the typed words of a first request, and gives the AI the lines too", () => {
    const request = { text: "A tea ad", details: "Platforms: TikTok." };

    expect(shownRequestTextOf(request)).toBe("A tea ad");
    expect(fullRequestTextOf(request)).toBe("A tea ad\nPlatforms: TikTok.");
  });

  it("hides the lines for the AI of a first request that an older engine kept in one text", () => {
    expect(
      shownRequestTextOf({
        text: "A tea ad\nWarm.\nPlatforms: TikTok.\nLength: 15 seconds.",
      }),
    ).toBe("A tea ad\nWarm.");
  });
});
