import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createProject,
  type Output,
  type ProjectStore,
} from "@yumekit/project";
import {
  connectMediaTools,
  type MediaToolRequest,
  type MediaTools,
} from "@yumekit/tools";
import { onTestFinished, vi } from "vitest";

export const sampleServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL("../../../../tools/sample-media/src/main.ts", import.meta.url),
    ),
  ],
};

export const voiceServerCommand = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../tools/src/testing/voiceMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
};

export const smallOutput: Output = {
  id: "wide",
  label: "Wide",
  widthPixels: 320,
  heightPixels: 180,
};

export interface HarnessProjectOptions {
  outputs?: Output[];
  mediaToolsFile?: object;
  beforeConnect?: () => Promise<unknown>;
  withLocalVoice?: boolean;
}

export interface HarnessProject {
  store: ProjectStore;
  mediaTools: MediaTools;
  runRequests: MediaToolRequest[];
}

export async function startHarnessProject(
  options?: HarnessProjectOptions,
): Promise<HarnessProject> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-harness-"));
  const home = join(root, "home");
  await mkdir(home);
  vi.stubEnv("HOME", home);
  vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", join(home, ".config", "yumekit"));
  onTestFinished(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  const created = await createProject({
    folder: join(root, "project"),
    name: "Harness test",
    framesPerSecond: 30,
    outputs: options?.outputs ?? [smallOutput],
  });
  if (!created.ok) throw new Error(created.failure.message);
  const store = created.value;
  if (options?.mediaToolsFile !== undefined) {
    await writeFile(
      join(store.folder, "media-tools.json"),
      JSON.stringify(options.mediaToolsFile),
    );
  }
  await options?.beforeConnect?.();
  const connected = await connectMediaTools({
    projectFolder: store.folder,
    bundledServers: {
      sample: sampleServerCommand,
      ...(options?.withLocalVoice === true
        ? { "local-voice": voiceServerCommand }
        : {}),
    },
  });
  if (!connected.ok) throw new Error(connected.failure.message);
  const mediaTools = connected.value;
  const runRequests: MediaToolRequest[] = [];
  return {
    store,
    runRequests,
    mediaTools: {
      ...mediaTools,
      run: (request) => {
        runRequests.push(request);
        return mediaTools.run(request);
      },
    },
  };
}
