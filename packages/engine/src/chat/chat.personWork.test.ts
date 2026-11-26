import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { uploadRequest, wavBytes } from "../testing/uploadRequest.js";
import { init, result, whole } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";

const pathOfTheComputer = process.env["PATH"] ?? "";

type ChatEngine = Awaited<ReturnType<typeof startChatEngine>>;

const scenesRow = {
  id: "row",
  kind: "scene",
  clips: ["a", "b", "c"].map((...[sceneId, index]) => ({
    id: `clip-${sceneId}`,
    scene_id: sceneId,
    start_frame: index * 30,
    duration_frames: 30,
  })),
};

const rowOfTheAgent = {
  ...scenesRow,
  clips: scenesRow.clips.map((clip) => ({ ...clip, id: `new-${clip.id}` })),
};

async function videoOfThePerson(chat: ChatEngine): Promise<void> {
  for (const sceneId of ["a", "b", "c"]) {
    await callTool({
      ...chat.engine,
      name: "put_scene",
      input: {
        scene_id: sceneId,
        title: sceneId,
        kit_component: "title-card",
        props: { heading: sceneId },
      },
    });
  }
  const music = { id: "music", kind: "audio", clips: [] };
  await callTool({
    ...chat.engine,
    name: "set_timeline",
    input: { output_id: "wide", tracks: [scenesRow, music] },
  });
  vi.stubEnv("PATH", `${process.env["PATH"] ?? ""}:${pathOfTheComputer}`);
  const uploaded = await uploadRequest({
    ...chat.engine,
    name: "Calm pad.wav",
    body: wavBytes(3),
  });
  expect(uploaded.status).toBe(200);
  const musicWithTheFile = {
    ...music,
    clips: [{ asset_id: "calmpad", start_frame: 0, duration_frames: 90 }],
  };
  await callTool({
    ...chat.engine,
    name: "set_timeline",
    input: { output_id: "wide", tracks: [scenesRow, musicWithTheFile] },
  });
  await callTool({
    ...chat.engine,
    name: "set_transitions",
    input: { kind: "slide" },
  });
}

describe("the work of the person in a chat request", () => {
  it("names the music file in the change of the person", async () => {
    const chat = await startChatEngine({ steps: [] });

    await videoOfThePerson(chat);

    expect((await chat.readChat()).entries).toContainEqual(
      expect.objectContaining({
        by: "person",
        summary: "You added the music Calm pad.wav.",
      }),
    );
  });

  it("keeps the music and each slide when the agent writes the timeline again without them", async () => {
    const resultFile = join(
      process.env["TMPDIR"] ?? "/tmp",
      `set-timeline-${String(Date.now())}.json`,
    );
    onTestFinished(() => rm(resultFile, { force: true }));
    const chat = await startChatEngine({
      steps: [
        { print: init },
        {
          callTool: {
            name: "set_timeline",
            input: { output_id: "wide", tracks: [rowOfTheAgent] },
            saveResultTo: resultFile,
          },
        },
        { print: whole("I recorded the voice again.") },
        { print: result("completed") },
      ],
    });
    await videoOfThePerson(chat);
    const before = await readFile(
      join(chat.project.projectFolder, "timelines", "wide.json"),
      "utf8",
    );

    await chat.ask({ text: "Record the voice again." });
    await chat.waitUntilIdle();

    expect(
      await readFile(
        join(chat.project.projectFolder, "timelines", "wide.json"),
        "utf8",
      ),
    ).toBe(before);
    expect(JSON.parse(await readFile(resultFile, "utf8"))).toMatchObject({
      isError: true,
      data: {
        kind: "would-remove-the-work-of-the-person",
        removed: ["the music Calm pad.wav", "2 transitions"],
      },
    });
  });
});
