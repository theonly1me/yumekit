import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import {
  init,
  result,
  toolResult,
  toolUse,
  whole,
} from "./testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "./testing/chatEngine.js";

function putTitle(options: { sceneId: string; saveResultTo?: string }) {
  return {
    callTool: {
      name: "put_scene",
      input: {
        scene_id: options.sceneId,
        title: options.sceneId,
        kit_component: "title-card",
        props: { heading: options.sceneId },
      },
      ...(options.saveResultTo === undefined
        ? {}
        : { saveResultTo: options.saveResultTo }),
    },
  };
}

function leadSteps(folder: string): FakeStep[] {
  return [
    { print: init },
    { print: toolUse({ callId: "lead-1", tool: "ask_helper" }) },
    {
      callTool: {
        name: "ask_helper",
        input: {
          brief: "Draw the intro as a title card.",
          scene_ids: ["intro"],
        },
        saveResultTo: join(folder, "helper-result.json"),
      },
    },
    { print: toolResult({ callId: "lead-1", isError: false }) },
    { print: whole("A helper drew the intro.") },
    { print: result("completed") },
  ];
}

function helperSteps(folder: string): FakeStep[] {
  return [
    { print: init },
    putTitle({ sceneId: "intro" }),
    putTitle({ sceneId: "outro", saveResultTo: join(folder, "outside.json") }),
    {
      callTool: {
        name: "render_video",
        input: { output_id: "wide" },
        saveResultTo: join(folder, "render.json"),
      },
    },
    { print: whole("I drew the intro as a title card.") },
    { print: result("completed") },
  ];
}

async function jsonOf(file: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
  return typeof parsed === "object" && parsed !== null ? { ...parsed } : {};
}

describe("a helper of the lead agent", () => {
  it("runs as one more turn inside the request of the lead, changes only its scenes, and returns its text and changes as the tool result", async () => {
    const chat = await startChatEngine({ steps: [] });
    const folder = chat.project.root;
    await chat.writeScenario({
      steps: leadSteps(folder),
      helperSteps: helperSteps(folder),
    });

    await chat.ask({ text: "Make an intro." });
    const { entries } = await chat.waitUntilIdle();
    const helperResult = await jsonOf(join(folder, "helper-result.json"));
    const outside = await jsonOf(join(folder, "outside.json"));
    const render = await jsonOf(join(folder, "render.json"));
    const runs = await chat.runs();

    expect(helperResult).toMatchObject({
      isError: false,
      data: {
        text: "I drew the intro as a title card.",
        changed: [{ kind: "scene", id: "intro" }],
      },
    });
    expect(outside).toMatchObject({
      isError: true,
      data: { kind: "helper-not-permitted" },
    });
    expect(render).toMatchObject({ data: { kind: "helper-not-permitted" } });
    expect(entries).toContainEqual(
      expect.objectContaining({
        kind: "answer",
        state: "done",
        steps: [{ callId: "lead-1", tool: "ask_helper", state: "done" }],
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({ kind: "change", by: "ai", undoSteps: 1 }),
    );
    expect(runs).toHaveLength(2);
    expect(runs[1]?.join(" ")).toContain('"--helper"');
    expect(runs[1]).not.toContain("--resume");
  });

  it("refuses a helper outside a chat request of the person", async () => {
    const chat = await startChatEngine({ steps: [] });

    const answer = await callTool({
      ...chat.engine,
      name: "ask_helper",
      input: { brief: "Draw the intro.", scene_ids: ["intro"] },
      headers: { "x-yumekit-client": "agent" },
    });

    expect(JSON.parse(answer.body)).toMatchObject({
      isError: true,
      data: { kind: "no-helper" },
    });
  });
});
