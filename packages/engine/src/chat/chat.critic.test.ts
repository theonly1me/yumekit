import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { init, result, whole } from "./testing/claudeLines.js";
import {
  chatWithSwordSheet,
  criticSteps,
  failedSheet,
  jsonOf,
  saved,
} from "./testing/swordSheet.js";

describe("the critic of a review", () => {
  it("runs as a fresh turn with only the review tools, and its verdict is stored, not the lead's", async () => {
    const chat = await chatWithSwordSheet();
    const folder = chat.project.root;
    await chat.writeScenario({
      steps: [
        { print: init },
        {
          callTool: {
            name: "review_sheet",
            input: { cast_id: "sword" },
            saveResultTo: saved({ folder, name: "review" }),
          },
        },
        {
          callTool: {
            name: "give_sheet_review",
            input: { ...failedSheet, verdict: "pass", faults: [], counts: [] },
            saveResultTo: saved({ folder, name: "lead-verdict" }),
          },
        },
        { print: whole("The critic failed the sword sheet.") },
        { print: result("completed") },
      ],
      criticSteps: criticSteps(folder),
    });

    await chat.ask({ text: "Check the sword sheet." });
    await chat.waitUntilIdle();
    const review = await jsonOf(saved({ folder, name: "review" }));
    const leadVerdict = await jsonOf(saved({ folder, name: "lead-verdict" }));
    const criticGetWork = await jsonOf(
      saved({ folder, name: "critic-get-work" }),
    );
    const runs = await chat.runs();

    expect(review).toMatchObject({
      isError: false,
      data: {
        verdict: "fail",
        faults: ["The sheet draws a sheathed sword and a bare sword"],
      },
    });
    expect(leadVerdict).toMatchObject({ data: { kind: "critic-only" } });
    expect(criticGetWork).toMatchObject({
      data: { kind: "critic-not-permitted" },
    });
    expect(runs).toHaveLength(2);
    expect(runs[1]?.at(-1)).toMatch(
      /^Review job: the sheet of the cast entry "sword"/,
    );
    expect(runs[1]).not.toContain("--resume");
  });

  it("reviews for the person outside a chat request with the agent program", async () => {
    const chat = await chatWithSwordSheet();
    await chat.writeScenario({
      steps: [],
      criticSteps: criticSteps(chat.project.root),
    });

    const answer = await callTool({
      ...chat.engine,
      name: "review_sheet",
      input: { cast_id: "sword" },
    });

    expect(JSON.parse(answer.body)).toMatchObject({
      isError: false,
      data: { verdict: "fail" },
    });
  });

  it("starts no agent program for an agent call outside a chat request, and fails closed", async () => {
    const chat = await chatWithSwordSheet();
    await chat.writeScenario({
      steps: [],
      criticSteps: criticSteps(chat.project.root),
    });

    const answer = await callTool({
      ...chat.engine,
      name: "review_sheet",
      input: { cast_id: "sword" },
      headers: { "x-yumekit-client": "agent" },
    });

    expect(JSON.parse(answer.body)).toMatchObject({
      isError: true,
      data: { kind: "no-critic" },
    });
    await expect(chat.runs()).rejects.toThrow();
  });
});
