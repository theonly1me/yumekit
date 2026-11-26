import { describe, expect, it } from "vitest";
import { callTool } from "../testing/rawRequest.js";
import { startChatEngine } from "./testing/chatEngine.js";

type ChatEngine = Awaited<ReturnType<typeof startChatEngine>>;

async function lineAfter(options: {
  chat: ChatEngine;
  name: string;
  input: object;
}): Promise<unknown> {
  await callTool({
    ...options.chat.engine,
    name: options.name,
    input: options.input,
  });
  return (await options.chat.readChat()).entries.at(-1);
}

describe("the line of a change of the person in the chat", () => {
  it.each([
    {
      name: "set_checks",
      input: { checks: "critic" },
      line: "You changed how the AI checks the film.",
    },
    {
      name: "set_approve_pictures_first",
      input: { approve_pictures_first: false },
      line: 'You turned off "Approve pictures before clips".',
    },
    {
      name: "set_tempo",
      input: { tempo: 120 },
      line: "You changed the beat of the video.",
    },
    {
      name: "set_project_name",
      input: { name: "The ferry" },
      line: 'You renamed the project to "The ferry".',
    },
  ])("names what $name changed", async ({ name, input, line }) => {
    const chat = await startChatEngine({ steps: [] });

    const entry = await lineAfter({ chat, name, input });

    expect(entry).toMatchObject({
      kind: "change",
      by: "person",
      summary: line,
    });
  });

  it("says that the person turned the approval of pictures on again", async () => {
    const chat = await startChatEngine({ steps: [] });
    await lineAfter({
      chat,
      name: "set_approve_pictures_first",
      input: { approve_pictures_first: false },
    });

    const entry = await lineAfter({
      chat,
      name: "set_approve_pictures_first",
      input: { approve_pictures_first: true },
    });

    expect(entry).toMatchObject({
      summary: 'You turned on "Approve pictures before clips".',
    });
  });
});
