import { describe, expect, it } from "vitest";
import { choiceInForceOf, type HeldChoice } from "./heldChoice.js";

const heldTakeTwo: HeldChoice = {
  choice: { kind: "take", takeId: "take-2" },
  newestTakeId: "take-6",
};

describe("the choice of the person on the project screen", () => {
  it("holds an earlier take while no newer take appears", () => {
    expect(
      choiceInForceOf({ held: heldTakeTwo, newestTakeId: "take-6" }),
    ).toEqual({ kind: "take", takeId: "take-2" });
  });

  it("goes back to the newest take when the lead opens a newer take", () => {
    expect(
      choiceInForceOf({ held: heldTakeTwo, newestTakeId: "take-7" }),
    ).toEqual({ kind: "auto" });
  });
});
