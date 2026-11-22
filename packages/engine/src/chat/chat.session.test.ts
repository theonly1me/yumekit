import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callTool, titleScene } from "../testing/rawRequest.js";
import { init, madeUpSessionId, result, whole } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";

describe("the conversation of the chat", () => {
  it("keeps the chat and the session in the file, and resumes the session on the next request", async () => {
    const chat = await startChatEngine({
      steps: [
        { print: init },
        { print: whole("Hello.") },
        { print: result("completed") },
      ],
    });
    await chat.ask({ text: "Say hello." });
    await chat.waitUntilIdle();
    await chat.ask({ text: "Again." });
    await chat.waitUntilIdle();

    const runs = await chat.runs();
    expect(runs[0]).not.toContain("--resume");
    expect(runs[1]?.join(" ")).toContain(`--resume ${madeUpSessionId}`);
    expect(runs[1]?.at(-1)).toBe("Again.");
    await chat.engine.close();
    const saved: unknown = JSON.parse(
      await readFile(
        join(chat.project.projectFolder, ".yumekit", "chat", "chat.json"),
        "utf8",
      ),
    );
    expect(saved).toMatchObject({
      sessionId: madeUpSessionId,
      entries: [
        { kind: "request", text: "Say hello." },
        { kind: "answer", text: "Hello.", state: "done" },
        { kind: "request", text: "Again." },
        { kind: "answer", text: "Hello.", state: "done" },
      ],
    });
  });

  it("starts a new conversation with a notice when the resume fails", async () => {
    const chat = await startChatEngine({
      steps: [
        { print: init },
        { print: whole("Fresh start.") },
        { print: result("completed") },
      ],
      resumeFails: true,
    });
    await chat.ask({ text: "First." });
    await chat.waitUntilIdle();
    await chat.ask({ text: "Second." });
    const { entries } = await chat.waitUntilIdle();

    expect(entries.slice(2)).toEqual([
      expect.objectContaining({ kind: "request", text: "Second." }),
      expect.objectContaining({
        kind: "answer",
        state: "done",
        text: "Fresh start.",
      }),
      expect.objectContaining({
        kind: "notice",
        text: "The AI started a new conversation.",
      }),
    ]);
    expect((await chat.runs()).length).toBe(3);
  });

  it("names the picked scene in the first line of the text for the agent", async () => {
    const chat = await startChatEngine({
      steps: [{ print: init }, { print: result("completed") }],
    });
    await callTool({ ...chat.engine, name: "put_scene", input: titleScene });
    await callTool({
      ...chat.engine,
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "intro-clip",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 30,
              },
            ],
          },
        ],
      },
    });

    const asked = await chat.ask({
      text: "Make it blue.",
      about_clip_id: "intro-clip",
    });
    await chat.waitUntilIdle();

    expect(JSON.parse(asked.body)).toMatchObject({
      about: { sceneId: "intro", clipId: "intro-clip", title: "Intro" },
    });
    expect((await chat.runs())[0]?.at(-1)).toBe(
      'The person picked the scene "Intro" (scene id intro, clip id intro-clip).\nMake it blue.',
    );
  });
});
