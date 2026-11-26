import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProject } from "@yumekit/project";
import { onTestFinished, vi } from "vitest";
import type { ServerCommand } from "../agents/agentTypes.js";
import { startEngine } from "../startEngine.js";

export interface TestProject {
  root: string;
  projectFolder: string;
  configurationDirectory: string;
}

export interface TestEngine {
  url: string;
  token: string;
  origin: string;
  port: number;
  close: () => Promise<void>;
}

export async function createTestProject(options?: {
  userMediaTools?: object;
}): Promise<TestProject> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-engine-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const configurationDirectory = join(root, "config");
  await mkdir(configurationDirectory);
  vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", configurationDirectory);
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  if (options?.userMediaTools !== undefined) {
    await writeFile(
      join(configurationDirectory, "media-tools.json"),
      JSON.stringify(options.userMediaTools),
    );
  }
  const projectFolder = join(root, "project");
  const created = await createProject({
    folder: projectFolder,
    name: "engine test",
    framesPerSecond: 30,
    outputs: [
      { id: "wide", label: "Wide", widthPixels: 320, heightPixels: 180 },
    ],
  });
  if (!created.ok) throw new Error(created.failure.message);
  return { root, projectFolder, configurationDirectory };
}

export async function startTestEngine(options: {
  projectFolder: string;
  editorFolder?: string;
  port?: number;
  serverCommand?: ServerCommand;
  permissionWaitMilliseconds?: number;
}): Promise<TestEngine> {
  const started = await startEngine(options);
  if (!started.ok) {
    throw new Error(`The engine did not start: ${started.failure.kind}`);
  }
  const engine = started.value;
  onTestFinished(() => engine.close());
  const origin = new URL(engine.url).origin;
  return { ...engine, origin, port: Number(new URL(origin).port) };
}

export async function startedTestEngine(options?: {
  userMediaTools?: object;
  editorFolder?: string;
}): Promise<TestProject & { engine: TestEngine }> {
  const project = await createTestProject(options);
  const engine = await startTestEngine({
    projectFolder: project.projectFolder,
    ...(options?.editorFolder === undefined
      ? {}
      : { editorFolder: options.editorFolder }),
  });
  return { ...project, engine };
}
