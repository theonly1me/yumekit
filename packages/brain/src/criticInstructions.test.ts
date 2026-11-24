import { describe, expect, it } from "vitest";
import { criticInstructions, criticInstructionsOf } from "./index.js";

describe("the instructions of the critic", () => {
  it("make the critic a strict viewer that looks for faults with the owner's bar in his words", () => {
    expect(criticInstructions).toContain(
      "You are a strict viewer who hates AI slop. Your job is to find faults.",
    );
    expect(criticInstructions).toContain(
      "we need to avoid the door knob bullshit again",
    );
    expect(criticInstructions).toContain(
      "One sword in a hand and a second hilt at the waist is two swords.",
    );
    expect(criticInstructions).toContain(
      "Never excuse a blocking fault as style, speed, a camera swoop, or motion blur.",
    );
  });

  it("sort each fault as blocking or a note, keep the bar for clips, and name the anatomy of the mirrored hands", () => {
    expect(criticInstructions).toContain(
      "Only a blocking fault refuses. Put notes in notes, never in faults.",
    );
    expect(criticInstructions).toContain(
      "hands, bodies, objects, contact, the source of an effect, and continuity stay blocking.",
    );
    expect(criticInstructions).toContain(
      "each arm must join its own shoulder and end in the hand of that side",
    );
    expect(criticInstructions).not.toContain("A doubt is a fault.");
  });

  it("start with the rule of Cursor only for Cursor", () => {
    expect(criticInstructionsOf("cursor").split("\n")[0]).toContain(
      "Use only the yumekit tools.",
    );
    expect(criticInstructionsOf("claude-code")).toBe(criticInstructions);
  });
});
