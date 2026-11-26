import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { uploadRequest } from "../testing/uploadRequest.js";
import { init, result, whole } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";

type ChatEngine = Awaited<ReturnType<typeof startChatEngine>>;

const picture = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"></svg>',
);

async function twoScenesOnTheRow(chat: ChatEngine): Promise<void> {
  for (const [sceneId, title] of [
    ["s-k2", "Harbor"],
    ["s-q7", "Walk"],
  ]) {
    await callTool({
      ...chat.engine,
      name: "put_scene",
      input: {
        scene_id: sceneId,
        title,
        kit_component: "title-card",
        props: { heading: title },
      },
    });
  }
  await callTool({
    ...chat.engine,
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        {
          id: "row",
          kind: "scene",
          clips: [
            {
              id: "c-1",
              scene_id: "s-q7",
              start_frame: 0,
              duration_frames: 30,
            },
            {
              id: "c-2",
              scene_id: "s-k2",
              start_frame: 30,
              duration_frames: 30,
            },
          ],
        },
      ],
    },
  });
}

async function lastChange(chat: ChatEngine) {
  return (await chat.readChat()).entries.at(-1);
}

describe("the changes of the person in the chat", () => {
  it("names the scene by its number in the row", async () => {
    const chat = await startChatEngine({ steps: [] });
    await twoScenesOnTheRow(chat);

    await callTool({
      ...chat.engine,
      name: "put_scene",
      input: {
        scene_id: "s-k2",
        title: "Harbor",
        kit_component: "title-card",
        props: { heading: "Boats" },
      },
    });
    await callTool({
      ...chat.engine,
      name: "resize_scene_clip",
      input: { clip_id: "c-1", duration_frames: 60 },
    });

    const entries = (await chat.readChat()).entries.slice(-2);
    expect(entries).toEqual([
      expect.objectContaining({ summary: "You changed the text of scene 2." }),
      expect.objectContaining({
        summary: "You changed the length of scene 1.",
      }),
    ]);
  });

  it("names a rename of a scene and its new name, as the Scene tab sends it", async () => {
    const chat = await startChatEngine({ steps: [] });
    await twoScenesOnTheRow(chat);

    await callTool({
      ...chat.engine,
      name: "put_scene",
      input: {
        scene_id: "s-k2",
        title: "The harbor at dawn",
        kit_component: "title-card",
        props: { heading: "Harbor" },
      },
    });

    expect(await lastChange(chat)).toMatchObject({
      summary: 'You renamed scene 2 to "The harbor at dawn".',
    });
  });

  it("counts the files of one upload of several files, and keeps one file in the singular", async () => {
    const chat = await startChatEngine({ steps: [] });

    await uploadRequest({ ...chat.engine, name: "alone.svg", body: picture });
    const single = await lastChange(chat);
    for (const name of ["harbor.svg", "gulls.svg", "bell.svg"]) {
      await uploadRequest({
        ...chat.engine,
        name,
        body: picture,
        actId: "act-files",
      });
    }

    expect(single).toMatchObject({
      summary: "You added a file to the project.",
    });
    expect(await lastChange(chat)).toMatchObject({
      summary: "You added 3 files to the project.",
      undoSteps: 3,
    });
  });

  it("makes one entry with one undo for the calls of one act", async () => {
    const chat = await startChatEngine({ steps: [] });
    await twoScenesOnTheRow(chat);
    const before = (await chat.readChat()).entries.length;

    for (const script of ["one", "two"]) {
      await callTool({
        ...chat.engine,
        name: "set_script",
        input: { script },
        actId: "act-1",
      });
    }

    const entries = (await chat.readChat()).entries;
    expect(entries).toHaveLength(before + 1);
    const change = await lastChange(chat);
    expect(change).toMatchObject({ undoSteps: 2, undone: false });
    await chat.post({ path: `/api/chat/changes/${change?.id ?? ""}/undo` });
    expect(await lastChange(chat)).toMatchObject({
      undoSteps: 0,
      undone: true,
    });
  });
});

describe("a request with lines for the AI", () => {
  it("keeps the typed text and the lines apart, and gives the AI both", async () => {
    const chat = await startChatEngine({
      steps: [
        { print: init },
        { print: whole("Done.") },
        { print: result("completed") },
      ],
    });

    const asked = await chat.post({
      path: "/api/chat/requests",
      body: { text: "A tea ad", details: "Platforms: TikTok." },
    });
    await chat.waitUntilIdle();

    expect(asked.status).toBe(202);
    expect((await chat.readChat()).entries[0]).toMatchObject({
      kind: "request",
      text: "A tea ad",
      details: "Platforms: TikTok.",
    });
    const [run] = await chat.runs();
    expect(run?.at(-1)).toBe("A tea ad\nPlatforms: TikTok.");
  });
});
