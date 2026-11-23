import { describe, expect, it } from "vitest";
import { serverInstructions } from "./index.js";

describe("the server instructions", () => {
  it("send custom scenes through Motion design and check each scene during its entry and settled", () => {
    expect(serverInstructions).toContain(
      "3. Add each scene with put_scene. Prefer a kit scene. Call get_scene_guide before you write custom code, and follow its part Motion design. Put code that two or more custom scenes share in put_shared_code, and load a font file for the whole video with set_fonts. Check each new scene with preview_scenes twice: with frame 10 for its entry, and with no frame for its settled picture.",
    );
  });

  it("check the whole video with one contact sheet, and give times in beats with music", () => {
    expect(serverInstructions).toContain(
      "8. Check the whole video with one call of contact_sheet after each build of a timeline.",
    );
    expect(serverInstructions).toContain(
      "With music, call set_tempo with its tempo first, and give each time in beats (start_beat, duration_beats), so each cut lands on a beat.",
    );
  });

  it("set the transitions once for the whole video", () => {
    expect(serverInstructions).toContain(
      "Call set_transitions once for the whole video, not once for each clip.",
    );
  });
});
