import { describe, expect, it } from "vitest";
import { stepLinesOf } from "./stepLines.js";

describe("the plain lines for the steps of an answer", () => {
  it("names each step in plain words and never shows the name of a tool", () => {
    const lines = stepLinesOf([
      { callId: "1", tool: "set_script", state: "done" },
      { callId: "2", tool: "generate_asset", state: "done" },
      { callId: "3", tool: "place_narration", state: "running" },
      { callId: "4", tool: "a_new_tool", state: "running" },
    ]);

    expect(lines.map((line) => line.text)).toEqual([
      "Writing the script",
      "Making a picture or a sound",
      "Placing the voice",
      "Working on the project",
    ]);
    expect(lines.some((line) => line.text.includes("_"))).toBe(false);
  });

  it("shows one line for steps of the same kind in a row, with the state of the last one", () => {
    const lines = stepLinesOf([
      { callId: "1", tool: "get_project", state: "done" },
      { callId: "2", tool: "get_timeline", state: "running" },
      { callId: "3", tool: "put_scene", state: "done" },
      { callId: "4", tool: "put_scene", state: "failed" },
    ]);

    expect(lines).toEqual([
      { key: "1", text: "Reading the project", state: "running" },
      { key: "3", text: "Writing a scene", state: "failed" },
    ]);
  });

  it("shows the download line of the natural voice with its percent while it runs", () => {
    const progress = {
      done: 74_000_000,
      total: 148_000_000,
      message: "Getting the natural voice, one time, 148 MB",
    };
    const lines = stepLinesOf([
      { callId: "1", tool: "set_script", state: "done" },
      {
        callId: "2",
        tool: "generate_asset",
        state: "running",
        capability: "speech",
        progress,
      },
    ]);

    expect(lines.map((line) => line.text)).toEqual([
      "Writing the script",
      "Getting the natural voice, one time, 148 MB: 50 percent",
    ]);
  });
});
