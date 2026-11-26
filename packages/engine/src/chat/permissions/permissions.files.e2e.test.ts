import { realpath } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { rawRequest, withToken } from "../../testing/rawRequest.js";
import { startChatEngine } from "../testing/chatEngine.js";
import { init, result } from "../testing/claudeLines.js";
import { checkFileOf } from "./testing/permissionChat.js";

const quietSteps = [{ print: init }, { print: result("completed") }];

const noDecision = {};

function decisionOf(decision: string) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
    },
  };
}

async function addFolder(options: {
  chat: Awaited<ReturnType<typeof startChatEngine>>;
  folder: string;
}) {
  const answer = await rawRequest({
    port: options.chat.engine.port,
    path: "/api/lead-permissions/folders",
    method: "POST",
    headers: withToken({
      token: options.chat.engine.token,
      headers: { "content-type": "application/json" },
    }),
    body: JSON.stringify({ folder: options.folder }),
  });
  return {
    status: answer.status,
    body: z.looseObject({}).parse(JSON.parse(answer.body)),
  };
}

describe("the files that the lead may read", () => {
  it("asks nothing for a read inside the project, and asks the person for a read outside the project", async () => {
    const chat = await startChatEngine({ steps: quietSteps });
    const inside = join(chat.project.projectFolder, "notes", "plan.md");

    const checks = [
      await checkFileOf({ chat, input: { tool: "Read", path: inside } }),
      await checkFileOf({
        chat,
        input: { tool: "Grep", path: "${tool_input.path}" },
      }),
      await checkFileOf({
        chat,
        input: { tool: "Bash", command: "ls scenes" },
      }),
      await checkFileOf({
        chat,
        input: { tool: "Read", path: "/Users/somebody-else/notes.txt" },
      }),
      await checkFileOf({
        chat,
        input: { tool: "Bash", command: "cat ~/../somebody-else/notes.txt" },
      }),
    ];

    expect(checks).toMatchObject([
      noDecision,
      noDecision,
      noDecision,
      decisionOf("ask"),
      decisionOf("ask"),
    ]);
  });

  it("keeps the key folder closed, also inside a folder that the person allowed", async () => {
    const chat = await startChatEngine({ steps: quietSteps });
    const { configurationDirectory, root } = chat.project;
    const keysFile = join(configurationDirectory, "keys.json");

    const addedParent = await addFolder({ chat, folder: root });
    const addedKeys = await addFolder({ chat, folder: configurationDirectory });
    const checks = [
      await checkFileOf({ chat, input: { tool: "Read", path: keysFile } }),
      await checkFileOf({
        chat,
        input: { tool: "Bash", command: `cat '${keysFile}'` },
      }),
    ];

    expect(addedParent.status).toBe(200);
    expect(addedParent.body["note"]).toContain("stays closed to the AI");
    expect(addedKeys).toMatchObject({
      status: 400,
      body: { kind: "folder-holds-keys" },
    });
    expect(checks).toMatchObject([decisionOf("deny"), decisionOf("deny")]);
  });

  it("denies the run a direct edit of a file of the store and each read of the key folder", async () => {
    const chat = await startChatEngine({ steps: quietSteps });
    const projectFolder = await realpath(chat.project.projectFolder);
    const keysFolder = await realpath(chat.project.configurationDirectory);

    await chat.ask({ text: "Set the script to ready." });
    await chat.waitUntilIdle();
    const [flags = []] = await chat.runs();
    const settingsText = flags[flags.indexOf("--settings") + 1] ?? "{}";
    const { deny } = z
      .object({ permissions: z.object({ deny: z.array(z.string()) }) })
      .parse(JSON.parse(settingsText)).permissions;

    expect(deny).toEqual(
      expect.arrayContaining([
        `Read(/${keysFolder}/**)`,
        `Edit(/${keysFolder}/**)`,
        `Edit(/${projectFolder}/project.json)`,
        `Edit(/${projectFolder}/script.md)`,
        `Edit(/${projectFolder}/scenes/**)`,
        `Edit(/${projectFolder}/.yumekit/**)`,
      ]),
    );
  });
});
