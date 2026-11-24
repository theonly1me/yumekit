import { describe, expect, it } from "vitest";
import { sceneGuide } from "./index.js";

describe("the scene guide for a whole film", () => {
  it("tells the agent to write the shared parts and the frame first, in one put_work call", () => {
    expect(sceneGuide).toContain(
      "12. Write a whole film with put_work, in one call: the shared parts first (the frame, the type styles, the timing), then the scenes that use them, then the timeline.",
    );
    expect(sceneGuide).toContain(
      "The stage draws it once for the whole video, above the scenes and below the captions.",
    );
    expect(sceneGuide).toContain(
      "`props.scenes` lists the clips of the scenes row",
    );
  });

  it("tells the agent to keep the same margins and type scale, few things on screen, and cuts on the bar", () => {
    expect(sceneGuide).toContain(
      "so each scene has the same margins and the same type scale. Few things on screen. Cut on the bar: a scene lasts a whole number of bars (4 beats).",
    );
  });
});
