import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectFalMedia,
  placeholderKey,
  resultText,
  temporaryFolder,
} from "./testing/connectFalMedia.ts";
import { fakeFal, fakeUrls } from "./testing/fakeFal.ts";

async function callVideo(options: {
  environment: NodeJS.ProcessEnv;
  answer?: (request: Request) => Promise<Response> | undefined;
  statuses?: string[];
}) {
  const folder = await temporaryFolder();
  const media = await connectFalMedia({
    environment: options.environment,
    respond: fakeFal({
      ...(options.answer === undefined ? {} : { answer: options.answer }),
      ...(options.statuses === undefined ? {} : { statuses: options.statuses }),
    }),
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "A lake",
      duration_seconds: 5,
      output_directory: join(folder, "assets"),
      file_stem: "lake",
    },
  });
  return { result, requests: media.requests, waits: media.waits, folder };
}

const withKey = { FAL_KEY: placeholderKey };

describe("generate_video failures", () => {
  it("names FAL_KEY and passEnvironment and sends no request when the key is missing", async () => {
    const { result, requests } = await callVideo({ environment: {} });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("FAL_KEY is not set");
    expect(resultText(result)).toContain("passEnvironment");
    expect(requests).toHaveLength(0);
  });

  it("returns the status and the detail of a rejected submit and writes no file", async () => {
    const { result, folder } = await callVideo({
      environment: withKey,
      answer: (request) =>
        request.method === "POST"
          ? Promise.resolve(
              Response.json({ detail: "Invalid API key" }, { status: 401 }),
            )
          : undefined,
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe("fal answered 401: Invalid API key");
    expect(await readdir(folder)).toEqual([]);
  });

  it("returns each input error of the model with the request id", async () => {
    const { result } = await callVideo({
      environment: withKey,
      answer: (request) =>
        request.url === fakeUrls.responseUrl
          ? Promise.resolve(
              Response.json(
                {
                  detail: [
                    {
                      loc: ["body", "prompt"],
                      msg: "The prompt was flagged",
                      type: "content_policy_violation",
                    },
                  ],
                },
                { status: 422 },
              ),
            )
          : undefined,
    });

    expect(resultText(result)).toBe(
      "fal answered 422: body.prompt: The prompt was flagged (fal request req-1)",
    );
  });

  it("returns a message when fal cannot be reached", async () => {
    const { result } = await callVideo({
      environment: withKey,
      answer: () => Promise.reject(new Error("getaddrinfo ENOTFOUND")),
    });

    expect(resultText(result)).toBe("Cannot reach fal: getaddrinfo ENOTFOUND");
  });

  it("does not send the key to a status URL outside the fal queue hosts", async () => {
    const { result, requests } = await callVideo({
      environment: withKey,
      answer: (request) =>
        request.method === "POST"
          ? Promise.resolve(
              Response.json({
                request_id: "req-1",
                status_url: "https://example.com/status",
                response_url: fakeUrls.responseUrl,
              }),
            )
          : undefined,
    });

    expect(result.isError).toBe(true);
    expect(requests.map((request) => request.url)).not.toContain(
      "https://example.com/status",
    );
  });

  it("never puts the key in a failure message", async () => {
    const { result } = await callVideo({
      environment: withKey,
      answer: (request) =>
        request.method === "POST"
          ? Promise.resolve(
              Response.json(
                { detail: `Key ${placeholderKey} is not valid` },
                { status: 401 },
              ),
            )
          : undefined,
    });

    expect(resultText(result)).not.toContain(placeholderKey);
    expect(resultText(result)).toBe(
      "fal answered 401: Key [FAL_KEY] is not valid",
    );
  });

  it("stops after 550 seconds of polls, before the harness time limit, and names the fal request", async () => {
    const { result, requests, waits } = await callVideo({
      environment: withKey,
      statuses: Array.from({ length: 200 }, () => "IN_PROGRESS"),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "fal did not finish in 550 seconds, so the server stopped waiting. fal can still finish the request and bill it. (fal request req-1)",
    );
    expect(
      requests.filter((request) => request.url === fakeUrls.statusUrl),
    ).toHaveLength(110);
    expect(waits.reduce((total, seconds) => total + seconds, 0)).toBe(550);
  });
});
