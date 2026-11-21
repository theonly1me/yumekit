import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import {
  bodyOf,
  rawRequest,
  textFieldOf,
  withToken,
} from "../testing/rawRequest.js";

const limitBytes = 10 * 1024 * 1024;

function scriptBody(byteCount: number): Buffer {
  const frame = JSON.stringify({ input: { script: "" } });
  return Buffer.from(
    JSON.stringify({ input: { script: "a".repeat(byteCount - frame.length) } }),
  );
}

describe("the body limit of the engine", () => {
  it("accepts a body of exactly 10 MB", async () => {
    const { engine } = await startedTestEngine();
    const body = scriptBody(limitBytes);

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/tools/set_script",
      method: "POST",
      headers: withToken(engine),
      body,
    });

    expect(body.length).toBe(limitBytes);
    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toMatchObject({ isError: false });
  });

  it("rejects with 413 a streamed body one byte over 10 MB, and does not run the tool", async () => {
    const { engine } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/tools/set_script",
      method: "POST",
      headers: withToken(engine),
      body: scriptBody(limitBytes + 1),
    });
    const project = await rawRequest({
      port: engine.port,
      path: "/api/project",
      headers: withToken(engine),
    });

    expect(answer.status).toBe(413);
    expect(textFieldOf({ answer, name: "kind" })).toBe("body-too-large");
    expect(bodyOf(project)).toMatchObject({ script: "", revision: 0 });
  });

  it("rejects with 413 a request whose Content-Length is over 10 MB before it reads the body", async () => {
    const { engine } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/keys/YUMEKIT_TEST_KEY",
      method: "PUT",
      headers: withToken({
        token: engine.token,
        headers: { "content-length": String(limitBytes + 1) },
      }),
      body: scriptBody(limitBytes + 1),
    });

    expect(answer.status).toBe(413);
  });
});
