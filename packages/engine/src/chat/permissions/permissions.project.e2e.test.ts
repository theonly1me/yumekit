import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { rawRequest, withToken } from "../../testing/rawRequest.js";
import { startChatEngine } from "../testing/chatEngine.js";
import { init, result } from "../testing/claudeLines.js";
import {
  answerCard,
  askSteps,
  waitForOpenCard,
} from "./testing/permissionChat.js";

const outsideFolder = "/Users/somebody-else/Movies";

function valuesAfter(options: { flags: string[]; flag: string }): string[] {
  return [...options.flags.entries()].flatMap(([index, value]) =>
    options.flags[index - 1] === options.flag ? [value] : [],
  );
}

const quietSteps = [{ print: init }, { print: result("completed") }];

describe("what the person allows for this project", () => {
  it("gives the next run each rule and each folder that the person allowed for this project", async () => {
    const chat = await startChatEngine({ steps: [] });
    await chat.writeScenario({
      steps: askSteps({
        chat,
        asks: [
          {
            toolName: "WebFetch",
            input: { url: "https://example.com/about" },
            name: "page",
          },
          {
            toolName: "Read",
            input: { file_path: join(outsideFolder, "clip.mov") },
            name: "clip",
          },
        ],
      }),
    });

    await chat.ask({ text: "Open example.com, then look at my clip." });
    for (const expected of ["https://example.com/about", outsideFolder]) {
      const card = await waitForOpenCard(chat);
      expect(card.detail).toContain(expected);
      await answerCard({ chat, id: card.id, answer: "allow-for-project" });
    }
    await chat.waitUntilIdle();
    await chat.writeScenario({ steps: quietSteps });
    await chat.ask({ text: "Go on." });
    await chat.waitUntilIdle();
    const [, next = []] = await chat.runs();
    const allowed = next.indexOf("--allowedTools");

    expect(next.slice(allowed + 1, allowed + 3)).toEqual([
      "mcp__yumekit__*",
      "WebFetch(domain:example.com)",
    ]);
    expect(valuesAfter({ flags: next, flag: "--add-dir" })).toEqual([
      outsideFolder,
    ]);
  });

  it("runs the lead with only the yumekit tools when the person picks that in Settings", async () => {
    const chat = await startChatEngine({ steps: quietSteps });
    const picked = await rawRequest({
      port: chat.engine.port,
      path: "/api/lead-permissions/access",
      method: "PUT",
      headers: withToken({
        token: chat.engine.token,
        headers: { "content-type": "application/json" },
      }),
      body: JSON.stringify({ access: "yumekit-only" }),
    });

    await chat.ask({ text: "Set the script to ready." });
    await chat.waitUntilIdle();
    const [flags = []] = await chat.runs();

    expect(picked.status).toBe(200);
    expect(
      z.object({ access: z.string() }).parse(JSON.parse(picked.body)),
    ).toEqual({
      access: "yumekit-only",
    });
    expect(valuesAfter({ flags, flag: "--tools" })).toEqual([""]);
    expect(valuesAfter({ flags, flag: "--permission-mode" })).toEqual([
      "dontAsk",
    ]);
    expect(flags).not.toContain("--permission-prompt-tool");
  });

  it("asks the person by default, in auto mode", async () => {
    const chat = await startChatEngine({ steps: quietSteps });

    await chat.ask({ text: "Set the script to ready." });
    await chat.waitUntilIdle();
    const [flags = []] = await chat.runs();

    expect(valuesAfter({ flags, flag: "--permission-mode" })).toEqual(["auto"]);
    expect(valuesAfter({ flags, flag: "--permission-prompt-tool" })).toEqual([
      "mcp__yumekit__ask_permission",
    ]);
  });
});
