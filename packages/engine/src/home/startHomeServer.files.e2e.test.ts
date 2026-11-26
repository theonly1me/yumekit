import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { init, result, whole } from "../chat/testing/claudeLines.js";
import { rawRequest, withToken } from "../testing/rawRequest.js";
import { startTestHome } from "./testing/homeFixture.js";

const bellPicture = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="18"><circle cx="16" cy="9" r="6"/></svg>',
);

const stagedSchema = z.object({
  upload: z.object({ id: z.string(), name: z.string() }),
});

const createdSchema = z.object({
  url: z.string(),
  first_request: z.looseObject({ started: z.boolean() }),
});

const requestSchema = z.looseObject({
  kind: z.literal("request"),
  details: z.string(),
  files: z.array(z.object({ assetId: z.string(), name: z.string() })),
});

const answerScenario = {
  steps: [
    { print: init },
    { print: whole("I read your request.") },
    { print: result("completed") },
  ],
};

type TestHome = Awaited<ReturnType<typeof startTestHome>>;

async function stage(options: { test: TestHome; name: string }) {
  const answer = await rawRequest({
    port: options.test.port,
    path: `/api/home/uploads?name=${encodeURIComponent(options.name)}`,
    method: "POST",
    headers: withToken({ token: options.test.home.token }),
    body: bellPicture,
  });
  const body: unknown = JSON.parse(answer.body);
  return { status: answer.status, body };
}

async function firstRequestOf(url: string) {
  const address = new URL(url);
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const reply = await rawRequest({
      port: Number(address.port),
      path: "/api/chat",
      headers: withToken({ token: address.searchParams.get("token") ?? "" }),
    });
    const chat = z
      .object({
        state: z.string(),
        entries: z.array(z.looseObject({ kind: z.string() })),
      })
      .parse(JSON.parse(reply.body));
    const request = chat.entries.find((entry) => entry.kind === "request");
    if (chat.state === "idle" && request !== undefined) {
      return requestSchema.parse(request);
    }
    await delay(50);
  }
  throw new Error("The first request did not end.");
}

describe("the files and the form of the start box", () => {
  it("adds each staged file as an asset of the new project, and the first request names it with the form", async () => {
    const test = await startTestHome({ agent: answerScenario });
    const staged = stagedSchema.parse(
      (await stage({ test, name: "Bell.svg" })).body,
    );

    const answer = await test.send({
      path: "/api/home/projects",
      body: {
        request: "A trailer about a bell",
        platform_ids: ["youtube"],
        length: "auto",
        form: "trailer",
        files: [{ upload_id: staged.upload.id, name: "Bell.svg" }],
      },
    });
    const created = createdSchema.parse(JSON.parse(answer.body));
    const request = await firstRequestOf(created.url);

    expect(created.first_request).toEqual({ started: true });
    expect(request.files).toEqual([{ assetId: "bell", name: "Bell.svg" }]);
    expect(request.details).toContain(
      "Form: trailer. Give this form to set_story.",
    );
  });

  it("refuses a file name with no letters or digits, and starts no request for a file that is gone", async () => {
    const test = await startTestHome({ agent: answerScenario });

    const refused = await stage({ test, name: "...." });
    const answer = await test.send({
      path: "/api/home/projects",
      body: {
        request: "A trailer",
        platform_ids: ["youtube"],
        length: "auto",
        files: [{ upload_id: "not-staged", name: "Gone.png" }],
      },
    });
    const created = createdSchema.parse(JSON.parse(answer.body));

    expect(refused).toMatchObject({
      status: 400,
      body: { kind: "upload-name-not-valid" },
    });
    expect(created.first_request).toMatchObject({
      started: false,
      kind: "start-file-not-found",
    });
    expect(created.url).toMatch(/&first-request=start-file-not-found$/);
  });
});
