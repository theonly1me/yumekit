import { describe, expect, it } from "vitest";
import { serverInstructions } from "./index.js";

describe("the server instructions", () => {
  it("send custom scenes through Motion design and check each scene during its entry and settled", () => {
    expect(serverInstructions).toContain(
      "3. Add each scene with put_scene. Prefer a kit scene. Call get_scene_guide before you write custom code, and follow its part Motion design. Check each new scene with preview_scenes twice: with frame 10 for its entry, and with no frame for its settled picture.",
    );
  });

  it("set the transitions once for the whole video", () => {
    expect(serverInstructions).toContain(
      "Call set_transitions once for the whole video, not once for each clip.",
    );
  });
});
