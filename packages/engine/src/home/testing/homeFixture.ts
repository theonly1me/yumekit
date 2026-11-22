import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onTestFinished, vi } from "vitest";
import {
  installFakeAgent,
  type FakeAgentScenario,
} from "../../chat/testing/fakeAgentProgram.js";
import { rawRequest, withToken } from "../../testing/rawRequest.js";
import { startHomeServer } from "../startHomeServer.js";

export async function startTestHome(options: {
  agent: FakeAgentScenario | "none";
}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "yumekit-home-")));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const configurationDirectory = join(root, "config");
  const projectsFolder = join(root, "projects");
  await mkdir(configurationDirectory);
  vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", configurationDirectory);
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const agentFolder = join(root, "fake-agent");
  const agent =
    options.agent === "none"
      ? undefined
      : await installFakeAgent({
          folder: agentFolder,
          scenario: options.agent,
        });
  if (agent === undefined) {
    await mkdir(agentFolder);
    vi.stubEnv("PATH", agentFolder);
  }
  await writeFile(
    join(configurationDirectory, "settings.json"),
    JSON.stringify({
      projectsFolder,
      ...(agent === undefined
        ? {}
        : {
            agent: "claude-code",
            agentPrograms: { "claude-code": agent.programPath },
          }),
    }),
  );
  const started = await startHomeServer({
    serverCommandOf: () => ({ command: "/bin/false", args: [] }),
  });
  if (!started.ok) throw new Error("The home server did not start.");
  const home = started.value;
  onTestFinished(() => home.close());
  const port = Number(new URL(home.url).port);
  const send = (request: {
    path: string;
    body?: object;
    headers?: Record<string, string>;
  }) =>
    rawRequest({
      port,
      path: request.path,
      method: request.body === undefined ? "GET" : "POST",
      headers: {
        ...withToken({
          token: home.token,
          headers: { "content-type": "application/json" },
        }),
        ...request.headers,
      },
      ...(request.body === undefined
        ? {}
        : { body: JSON.stringify(request.body) }),
    });
  return {
    root,
    configurationDirectory,
    projectsFolder,
    home,
    port,
    agent,
    send,
  };
}
