import { describe, expect, it } from "vitest";
import { bodyOf } from "../testing/rawRequest.js";
import { uploadRequest } from "../testing/uploadRequest.js";
import { init, result, whole } from "./testing/claudeLines.js";
import { startChatEngine } from "./testing/chatEngine.js";
import { lastRequestTextOf } from "./testing/questionRound.js";

const sketch = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>',
);

const quickAnswer = [
  { print: init },
  { print: whole("I see the sketch.") },
  { print: result("completed") },
];

async function uploadedAssetId(options: {
  chat: Awaited<ReturnType<typeof startChatEngine>>;
  name: string;
}): Promise<string> {
  const uploaded = await uploadRequest({
    ...options.chat.engine,
    name: options.name,
    body: sketch,
  });
  const body = bodyOf(uploaded);
  const asset: unknown =
    typeof body === "object" && body !== null
      ? Reflect.get(body, "asset")
      : undefined;
  const id: unknown =
    typeof asset === "object" && asset !== null
      ? Reflect.get(asset, "id")
      : undefined;
  if (typeof id !== "string") throw new Error(uploaded.body);
  return id;
}

describe("files in the chat", () => {
  it("names each dropped picture in the request with its name, its asset id, and its kind", async () => {
    const chat = await startChatEngine({ steps: quickAnswer });
    const assetId = await uploadedAssetId({ chat, name: "hero-sketch.svg" });

    const sent = await chat.ask({
      text: "Use this for the hero.",
      files: [{ asset_id: assetId, name: "hero-sketch.svg" }],
    });
    await chat.waitUntilIdle();
    const requestText = await lastRequestTextOf(chat);

    expect(sent.status).toBe(202);
    expect(JSON.parse(sent.body)).toMatchObject({
      kind: "request",
      files: [
        { assetId: "hero-sketch", name: "hero-sketch.svg", kind: "image" },
      ],
    });
    expect(requestText).toBe(
      [
        "Use this for the hero.",
        "",
        "The person added a file to this message. Each file is an asset of the project now. Look at each picture and video with preview_assets before you use it.",
        "- hero-sketch.svg: a picture, asset id hero-sketch",
      ].join("\n"),
    );
  });

  it("starts a request with files and no words", async () => {
    const chat = await startChatEngine({ steps: quickAnswer });
    const assetId = await uploadedAssetId({ chat, name: "board.svg" });

    const sent = await chat.ask({
      text: "",
      files: [{ asset_id: assetId, name: "board.svg" }],
    });
    await chat.waitUntilIdle();

    expect(sent.status).toBe(202);
    expect(await lastRequestTextOf(chat)).toContain(
      "- board.svg: a picture, asset id board",
    );
  });

  it("refuses a request with a file that is not in the project, and starts no turn", async () => {
    const chat = await startChatEngine({ steps: quickAnswer });

    const sent = await chat.ask({
      text: "Use this.",
      files: [{ asset_id: "gone", name: "gone.png" }],
    });
    const empty = await chat.ask({ text: "  " });

    expect(sent.status).toBe(404);
    expect(JSON.parse(sent.body)).toMatchObject({
      kind: "file-not-found",
      message:
        "The file gone.png is not in the project now. Remove it, and add it again.",
    });
    expect(empty.status).toBe(400);
    expect((await chat.readChat()).entries).toEqual([]);
  });
});
