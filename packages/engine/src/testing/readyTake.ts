import { init, result, whole } from "../chat/testing/claudeLines.js";
import { startChatEngine, type FakeStep } from "../chat/testing/chatEngine.js";

function picture(assetId: string) {
  return {
    asset_id: assetId,
    capability: "image",
    input: { prompt: assetId, width_pixels: 32, height_pixels: 18 },
  };
}

export const leadMakesPictures: FakeStep[] = [
  { print: init },
  { callTool: { name: "open_take", input: { step: "pictures" } } },
  {
    callTool: {
      name: "generate_assets",
      input: { calls: [picture("harbor"), picture("ferry")] },
    },
  },
  {
    callTool: {
      name: "ready_take",
      input: {
        items: [
          { id: "harbor", note: "The harbor wall in fog." },
          { id: "ferry", note: "The ferry at the dock." },
        ],
      },
    },
  },
  { print: whole("Take 1 is ready for you.") },
  { print: result("completed") },
];

export function leadReads(extra: FakeStep[]): FakeStep[] {
  return [
    { print: init },
    ...extra,
    { print: whole("I read your notes.") },
    { print: result("completed") },
  ];
}

export async function startWithReadyTake(afterReady: FakeStep[] = []) {
  const steps = [
    ...leadMakesPictures.slice(0, -2),
    ...afterReady,
    ...leadMakesPictures.slice(-2),
  ];
  const chat = await startChatEngine({ steps });
  await chat.ask({ text: "Make the pictures of the harbor." });
  await chat.waitUntilIdle();
  return chat;
}

export function lastRequestOf(runs: string[][]): string {
  return runs.at(-1)?.at(-1) ?? "";
}
