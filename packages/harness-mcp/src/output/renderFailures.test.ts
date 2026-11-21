import { describe, expect, it } from "vitest";
import { renderFailureOf } from "./renderFailures.js";

describe("renderFailureOf", () => {
  it("names the scene and the frame of a scene that fails, so an editor can open it", () => {
    const failure = renderFailureOf({
      kind: "scene-error",
      message: "The scene threw.",
      sceneId: "intro",
      frame: 15,
    });

    expect(failure).toMatchObject({
      kind: "scene-error",
      scene_id: "intro",
      frame: 15,
    });
  });

  it("names the first scene of a scene that is not repeatable", () => {
    const failure = renderFailureOf({
      kind: "scene-not-repeatable",
      message: "Two pictures differ.",
      sceneIds: ["first", "second"],
      frame: 3,
    });

    expect(failure).toMatchObject({ scene_id: "first", frame: 3 });
  });

  it("names no scene for a failure that is not about a scene", () => {
    const failure = renderFailureOf({
      kind: "ffmpeg-not-found",
      message: "No ffmpeg.",
    });

    expect(failure).not.toHaveProperty("scene_id");
    expect(failure).not.toHaveProperty("frame");
  });
});
