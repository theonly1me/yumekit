import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import {
  createTestProject,
  startTestEngine,
} from "../../testing/engineFixture.js";
import { openEvents } from "../../testing/eventsClient.js";
import { rawRequest, withToken } from "../../testing/rawRequest.js";
import {
  installFakeAgent,
  type FakeAgentScenario,
} from "./fakeAgentProgram.js";

export type { FakeAgentScenario, FakeStep } from "./fakeAgentProgram.js";

const chatSchema = z.object({
  state: z.enum(["idle", "running"]),
  entries: z.array(z.looseObject({ kind: z.string(), id: z.string() })),
});

export async function startChatEngine(
  setup: FakeAgentScenario & { userMediaTools?: object },
) {
  const { userMediaTools, ...scenario } = setup;
  const project = await createTestProject(
    userMediaTools === undefined ? undefined : { userMediaTools },
  );
  const { programPath, scenarioFile, writeScenario } = await installFakeAgent({
    folder: join(project.root, "fake-agent"),
    scenario,
  });
  await writeFile(
    join(project.configurationDirectory, "settings.json"),
    JSON.stringify({
      agent: "claude-code",
      agentPrograms: { "claude-code": programPath },
    }),
  );
  const engine = await startTestEngine({
    projectFolder: project.projectFolder,
    serverCommand: { command: "/bin/false", args: [] },
  });
  const events = await openEvents(engine);
  const post = (options: { path: string; body?: object }) =>
    rawRequest({
      port: engine.port,
      path: options.path,
      method: "POST",
      headers: withToken({
        token: engine.token,
        headers: { "content-type": "application/json" },
      }),
      body: JSON.stringify(options.body ?? {}),
    });
  const readChat = async () => {
    const answer = await rawRequest({
      port: engine.port,
      path: "/api/chat",
      headers: withToken(engine),
    });
    return chatSchema.parse(JSON.parse(answer.body));
  };
  const waitUntilIdle = async () => {
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const chat = await readChat();
      if (chat.state === "idle") return chat;
      await delay(50);
    }
    throw new Error("The chat request did not end.");
  };
  const runs = async () =>
    (await readFile(`${scenarioFile}.runs.jsonl`, "utf8"))
      .trim()
      .split("\n")
      .map((runLine) => z.array(z.string()).parse(JSON.parse(runLine)));
  return {
    project,
    engine,
    events,
    post,
    readChat,
    waitUntilIdle,
    runs,
    writeScenario,
    ask: (body: {
      text: string;
      about_clip_id?: string;
      files?: { asset_id: string; name: string }[];
    }) => post({ path: "/api/chat/requests", body }),
  };
}
