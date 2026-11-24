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
      "Never excuse a fault as style, speed, a camera swoop, or motion blur.",
    );
  });

  it("start with the rule of Cursor only for Cursor", () => {
    expect(criticInstructionsOf("cursor").split("\n")[0]).toContain(
      "Use only the yumekit tools.",
    );
    expect(criticInstructionsOf("claude-code")).toBe(criticInstructions);
  });
});
