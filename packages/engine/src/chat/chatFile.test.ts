import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { lastSentenceOf } from "./answerTracker.js";
import { chatFilePath, loadChat } from "./chatFile.js";

async function projectWithChat(content: string): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-chat-file-"));
  onTestFinished(() => rm(folder, { recursive: true, force: true }));
  await mkdir(dirname(chatFilePath(folder)), { recursive: true });
  await writeFile(chatFilePath(folder), content);
  return folder;
}

describe("the chat file", () => {
  it("loads an answer that was running as stopped", async () => {
    const folder = await projectWithChat(
      JSON.stringify({
        sessionId: "session-1",
        entries: [
          { kind: "request", id: "r1", text: "Hi.", about: null },
          {
            kind: "answer",
            id: "a1",
            text: "Hel",
            state: "running",
            steps: [],
          },
        ],
      }),
    );

    expect(await loadChat(folder)).toEqual({
      sessionId: "session-1",
      redoChangeIds: [],
      entries: [
        { kind: "request", id: "r1", text: "Hi.", about: null },
        { kind: "answer", id: "a1", text: "Hel", state: "stopped", steps: [] },
      ],
    });
  });

  it("starts an empty chat when the file is not valid", async () => {
    const folder = await projectWithChat("{ not json");

    expect(await loadChat(folder)).toEqual({
      sessionId: null,
      entries: [],
      redoChangeIds: [],
    });
  });
});

describe("the summary of a change by the AI", () => {
  it("is the last sentence of the answer, cut at 140 characters", () => {
    expect(lastSentenceOf("I set the script. It now says ready.")).toBe(
      "It now says ready.",
    );
    expect(lastSentenceOf(`Done. ${"a".repeat(200)}`)).toBe("a".repeat(140));
    expect(lastSentenceOf("")).toBe("");
  });
});
