import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startedTestEngine } from "../testing/engineFixture.js";
import { isEventOfType, openEvents } from "../testing/eventsClient.js";
import {
  bodyOf,
  callTool,
  rawRequest,
  textFieldOf,
  titleScene,
  withToken,
} from "../testing/rawRequest.js";

const toolListSchema = z.object({
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      inputSchema: z.record(z.string(), z.unknown()),
    }),
  ),
});

describe("the project interface of the engine", () => {
  it("changes the project with put_scene and sends project-changed with the new revision", async () => {
    const { engine } = await startedTestEngine();
    const events = await openEvents(engine);
    const before = await rawRequest({
      port: engine.port,
      path: "/api/project",
      headers: withToken(engine),
    });

    const answer = await callTool({
      ...engine,
      name: "put_scene",
      input: titleScene,
    });
    const changed = await events.waitFor(isEventOfType("project-changed"));
    const after = await rawRequest({
      port: engine.port,
      path: "/api/project",
      headers: withToken(engine),
    });

    expect(answer.status).toBe(200);
    expect(bodyOf(answer)).toMatchObject({ isError: false, images: [] });
    expect(bodyOf(before)).toMatchObject({ revision: 0, scenes: [] });
    expect(bodyOf(after)).toMatchObject({
      revision: 1,
      scenes: [{ id: "intro", title: "Intro" }],
    });
    expect(changed).toEqual({ type: "project-changed", revision: 1 });
  });

  it("answers a tool that fails with status 200 and isError, and a tool that does not exist with 404", async () => {
    const { engine } = await startedTestEngine();

    const failed = await callTool({
      ...engine,
      name: "get_scene",
      input: { scene_id: "missing" },
    });
    const missing = await callTool({
      ...engine,
      name: "no_such_tool",
      input: {},
    });

    expect(failed.status).toBe(200);
    expect(bodyOf(failed)).toMatchObject({ isError: true });
    expect(missing.status).toBe(404);
    expect(textFieldOf({ answer: missing, name: "kind" })).toBe(
      "tool-not-found",
    );
  });

  it("answers a body that does not match its schema with 400 and the schema error", async () => {
    const { engine } = await startedTestEngine();
    const send = (body: string) =>
      rawRequest({
        port: engine.port,
        path: "/api/tools/set_script",
        method: "POST",
        headers: withToken(engine),
        body,
      });

    const [notJson, notObject, extraField] = await Promise.all([
      send("not json"),
      send(JSON.stringify({ input: "text" })),
      send(JSON.stringify({ input: {}, extra: 1 })),
    ]);

    expect([notJson.status, notObject.status, extraField.status]).toEqual([
      400, 400, 400,
    ]);
    expect(textFieldOf({ answer: notObject, name: "message" })).toContain(
      "input",
    );
    expect(textFieldOf({ answer: extraField, name: "message" })).toContain(
      "extra",
    );
  });

  it("lists the harness tools with their schemas", async () => {
    const { engine } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/tools",
      headers: withToken(engine),
    });

    const { tools } = toolListSchema.parse(bodyOf(answer));

    expect(tools).toHaveLength(43);
    expect(tools.find((tool) => tool.name === "put_scene")).toMatchObject({
      inputSchema: { type: "object" },
    });
  });

  it("returns the same media server data as list_media_tools", async () => {
    const { engine } = await startedTestEngine();

    const servers = await rawRequest({
      port: engine.port,
      path: "/api/media-servers",
      headers: withToken(engine),
    });
    const listed = await callTool({
      ...engine,
      name: "list_media_tools",
      input: {},
    });

    expect(bodyOf(servers)).toMatchObject({
      servers: [
        { server: "sample" },
        { server: "openai" },
        { server: "gemini" },
        { server: "fal" },
      ],
    });
    expect(bodyOf(listed)).toMatchObject({ data: bodyOf(servers) });
  });

  it("gives the preview page of an output with the engine origin as parentOrigin", async () => {
    const { engine } = await startedTestEngine();

    const answer = await rawRequest({
      port: engine.port,
      path: "/api/preview?output=wide",
      headers: withToken(engine),
    });
    const missing = await rawRequest({
      port: engine.port,
      path: "/api/preview?output=nothing",
      headers: withToken(engine),
    });
    const pageUrl = new URL(textFieldOf({ answer, name: "pageUrl" }));

    expect(pageUrl.hostname).toBe("127.0.0.1");
    expect(pageUrl.pathname).toBe("/preview.html");
    expect(pageUrl.searchParams.get("output")).toBe("wide");
    expect(pageUrl.searchParams.get("parentOrigin")).toBe(engine.origin);
    expect(missing.status).toBe(404);
  });
});
