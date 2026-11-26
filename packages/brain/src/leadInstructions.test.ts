import { describe, expect, it } from "vitest";
import { leadInstructionsOf } from "./leadInstructions.js";

describe("the instructions of the lead", () => {
  it("tell the lead what it may now do only when it runs with the tools of its program", () => {
    const open = leadInstructionsOf({
      agentId: "claude-code",
      access: {
        kind: "program",
        readFolders: [],
        closedFolders: ["/Users/maya/.config/yumekit"],
        readOnly: { files: [], folders: [] },
        allowedRules: [],
      },
    });
    const locked = leadInstructionsOf({
      agentId: "claude-code",
      access: { kind: "yumekit-only" },
    });

    expect(open).toContain("call import_asset");
    expect(open).toContain("the person gets a card in the chat to allow it");
    expect(open).not.toContain("You have only the yumekit tools.");
    expect(locked).toContain("You have only the yumekit tools.");
    expect(locked).not.toContain("call import_asset");
  });
});
