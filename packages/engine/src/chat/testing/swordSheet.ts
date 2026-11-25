import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { callTool } from "../../testing/rawRequest.js";
import { init, result, whole } from "./claudeLines.js";
import { startChatEngine, type FakeStep } from "./chatEngine.js";

export const failedSheet = {
  checks: [1, 2, 3, 4, 5, 6, 7, 8].map((item) => ({ item, seen: "Seen." })),
  counts: [{ object: "swords", expected: 1, seen: 2 }],
  verdict: "fail",
  faults: ["The sheet draws a sheathed sword and a bare sword"],
};

export function saved(options: { folder: string; name: string }) {
  return join(options.folder, `${options.name}.json`);
}

export function criticSteps(folder: string): FakeStep[] {
  return [
    { print: init },
    {
      callTool: {
        name: "get_work",
        input: {},
        saveResultTo: saved({ folder, name: "critic-get-work" }),
      },
    },
    { callTool: { name: "view_for_review", input: {} } },
    { callTool: { name: "give_sheet_review", input: failedSheet } },
    { print: whole("The sheet fails.") },
    { print: result("completed") },
  ];
}

export async function jsonOf(file: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
  return typeof parsed === "object" && parsed !== null ? { ...parsed } : {};
}

export async function chatWithSwordSheet() {
  const chat = await startChatEngine({ steps: [] });
  const person = { ...chat.engine };
  await callTool({
    ...person,
    name: "generate_asset",
    input: {
      asset_id: "sword-sheet",
      capability: "image",
      input: { prompt: "a sword", width_pixels: 32, height_pixels: 18 },
    },
  });
  await callTool({
    ...person,
    name: "put_cast_member",
    input: {
      cast_id: "sword",
      kind: "prop",
      name: "The sword",
      description: "One curved sword",
      facts: ["Exactly one sword"],
      reference_asset_ids: ["sword-sheet"],
    },
  });
  return chat;
}
