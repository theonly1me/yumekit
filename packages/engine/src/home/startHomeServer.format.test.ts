import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { init, result, whole } from "../chat/testing/claudeLines.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { startTestHome } from "./testing/homeFixture.js";

const createdSchema = z.object({ url: z.string() });

const chatSchema = z.object({
  state: z.string(),
  entries: z.array(z.looseObject({ kind: z.string(), text: z.string() })),
});

const answerScenario = {
  steps: [
    { print: init },
    { print: whole("The plan is ready.") },
    { print: result("completed") },
  ],
};

const planFirstSentence =
  "Stop after the script and the pictures of each scene, drawn by code. Make no voice, no music, and no paid clip yet. Ask me to continue.";

async function firstRequestOf(body: object): Promise<string> {
  const test = await startTestHome({ agent: answerScenario });
  const answer = await test.send({ path: "/api/home/projects", body });
  const address = new URL(createdSchema.parse(JSON.parse(answer.body)).url);
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const reply = await rawRequest({
      port: Number(address.port),
      path: "/api/chat",
      headers: withToken({ token: address.searchParams.get("token") ?? "" }),
    });
    const chat = chatSchema.parse(JSON.parse(reply.body));
    const [request] = chat.entries;
    if (chat.state === "idle" && request !== undefined) return request.text;
    await delay(50);
  }
  throw new Error("The first request did not end.");
}

const tea = { request: "Tea", platform_ids: ["tiktok"], length: 15 };

describe("the start format and the plan first of a new project", () => {
  it.each([
    { formatId: "explainer", name: "Explainer" },
    { formatId: "product-ad", name: "Product ad" },
    { formatId: "story", name: "Story" },
    { formatId: "talking-head", name: "Talking head" },
    { formatId: "list", name: "5 tips" },
    { formatId: "quote", name: "Quote" },
    { formatId: "news", name: "News" },
  ])(
    "puts the direction of $formatId below the line of the platforms",
    async ({ formatId, name }) => {
      const text = await firstRequestOf({ ...tea, format_id: formatId });
      const lines = text.split("\n");

      expect(lines.slice(0, 2)).toEqual(["Tea", "Platforms: TikTok."]);
      expect(lines[2]).toMatch(
        new RegExp(`^Format: ${name}\\. Structure, in this order: .+ Avoid: `),
      );
      expect(lines[3]).toBe("Length: 15 seconds.");
    },
  );

  it("adds no format line for No format, and no plan sentence without the switch", async () => {
    const text = await firstRequestOf({ ...tea, format_id: "free" });

    expect(text).toBe(
      "Tea\nPlatforms: TikTok.\nLength: 15 seconds.\nBetween scenes: a fade from each scene to the next.",
    );
  });

  it("ends the first request with the stop sentence when the person asks for the plan first", async () => {
    const text = await firstRequestOf({
      ...tea,
      format_id: "product-ad",
      plan_first: true,
    });

    expect(text.split("\n").at(-1)).toBe(planFirstSentence);
  });

  it("refuses a format that is not in the catalog, and makes no project", async () => {
    const test = await startTestHome({ agent: answerScenario });

    const answer = await test.send({
      path: "/api/home/projects",
      body: { ...tea, format_id: "tutorial" },
    });

    expect(answer.status).toBe(400);
    expect(JSON.parse(answer.body)).toMatchObject({ kind: "body-not-valid" });
  });
});
