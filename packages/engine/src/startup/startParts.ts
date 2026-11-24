import { readFile } from "node:fs/promises";
import {
  createHarness,
  type AskCritic,
  type AskHelper,
  type Harness,
} from "@yumekit/harness-mcp";
import type { ProjectStore } from "@yumekit/project";
import { startPreviewServer, type PreviewServer } from "@yumekit/render";
import {
  connectMediaTools,
  findBundledServers,
  type MediaTools,
} from "@yumekit/tools";
import { z } from "zod";
import type { EngineFailure, Outcome } from "../engineTypes.js";

export interface EngineParts {
  version: string;
  mediaTools: MediaTools;
  harness: Harness;
  preview: PreviewServer;
}

const packageSchema = z.object({ version: z.string() });

export async function engineVersion(): Promise<string> {
  const text = await readFile(
    new URL("../../package.json", import.meta.url),
    "utf8",
  );
  return packageSchema.parse(JSON.parse(text)).version;
}

function projectInvalid(message: string): {
  ok: false;
  failure: EngineFailure;
} {
  return { ok: false, failure: { kind: "project-invalid", message } };
}

export async function startParts(options: {
  projectFolder: string;
  store: ProjectStore;
  askHelper: AskHelper;
  askCritic: AskCritic;
}): Promise<Outcome<EngineParts, EngineFailure>> {
  const { projectFolder, store } = options;
  const connected = await connectMediaTools({
    projectFolder,
    bundledServers: await findBundledServers(),
  });
  if (!connected.ok) {
    return projectInvalid(
      `${connected.failure.file} is not valid: ${connected.failure.message}`,
    );
  }
  const mediaTools = connected.value;
  const harness = createHarness({
    store,
    mediaTools,
    askHelper: options.askHelper,
    askCritic: options.askCritic,
  });
  const preview = await startPreviewServer({ projectFolder });
  if (!preview.ok) {
    await harness.close();
    return projectInvalid(preview.failure.message);
  }
  return {
    ok: true,
    value: {
      version: await engineVersion(),
      mediaTools,
      harness,
      preview: preview.value,
    },
  };
}
