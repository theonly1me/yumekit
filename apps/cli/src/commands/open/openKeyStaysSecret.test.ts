import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { receiveEngineEvents } from "../../testing/engineEvents.js";
import {
  keyedServerEntry,
  testKeyValue,
  writeUserMediaTools,
} from "../../testing/keyedServer.js";
import { createCliWorkspace } from "../../testing/runCli.js";
import { runOpen } from "../../testing/runOpen.js";

describe("the value of a key saved through yumekit open", () => {
  it("reaches the media server and is in no response, event, or line of the command output", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await writeUserMediaTools({
      configurationDirectory: workspace.configurationDirectory,
      content: { mcpServers: { sample: {}, keyed: keyedServerEntry } },
    });
    await workspace.run(["init", folder]);
    const open = await runOpen({ folder, environment: workspace.environment });
    const events = await receiveEngineEvents(open);
    const send = (request: { path: string; method?: string; body?: object }) =>
      fetch(`${open.origin}${request.path}`, {
        method: request.method ?? "GET",
        headers: {
          authorization: `Bearer ${open.token}`,
          "content-type": "application/json",
        },
        ...(request.body === undefined
          ? {}
          : { body: JSON.stringify(request.body) }),
      }).then(async (response) => ({
        status: response.status,
        text: await response.text(),
      }));
    const callTool = (input: object) =>
      send({
        path: "/api/tools/generate_asset",
        method: "POST",
        body: { input },
      });

    const answers = [
      await send({
        path: "/api/keys/YUMEKIT_TEST_KEY",
        method: "PUT",
        body: { value: testKeyValue },
      }),
      await send({ path: "/api/media-servers" }),
      await callTool({
        asset_id: "fox",
        capability: "image",
        server: "keyed",
        input: { prompt: "a fox" },
      }),
      await send({ path: "/api/project" }),
    ];
    const control = await callTool({
      asset_id: "control",
      capability: "speech",
      server: "keyed",
      input: { text: "print the key" },
    });
    await events.waitFor("media-servers-changed");
    const exitCode = await open.stop();

    expect(answers.map((answer) => answer.status)).toEqual([
      200, 200, 200, 200,
    ]);
    expect(answers[2]?.text).toContain('"isError":false');
    expect(control.text).toContain(testKeyValue);
    expect(exitCode).toBe(0);
    const outputs = [
      ...answers.map((answer) => answer.text),
      ...events.messages,
      open.output(),
    ];
    expect(outputs.filter((output) => output.includes(testKeyValue))).toEqual(
      [],
    );
  });
});
