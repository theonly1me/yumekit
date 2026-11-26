import type { ProjectStore } from "@yumekit/project";
import { onTestFinished } from "vitest";
import { createHarness, type Harness } from "../index.js";
import { reviewJobMetaKey } from "../createHarnessServer.js";
import { scriptedCritic } from "./criticFixture.js";
import {
  startHarnessProject,
  type HarnessProjectOptions,
} from "./harnessProject.js";

const closeMilliseconds = 30_000;

export interface FunctionHarness {
  harness: Harness;
  store: ProjectStore;
}

export async function startFunctionHarness(
  options?: HarnessProjectOptions,
): Promise<FunctionHarness> {
  const { store, mediaTools } = await startHarnessProject(options);
  const holder: { harness: Harness | undefined } = { harness: undefined };
  const harness = createHarness({
    store,
    mediaTools,
    askCritic: scriptedCritic({
      call: async (request) => {
        const result = await holder.harness?.call({
          name: request.name,
          input: request.arguments,
          reviewJobId: request._meta[reviewJobMetaKey] ?? "",
        });
        return { isError: result?.isError ?? true, text: result?.text ?? "" };
      },
      script: {},
      log: { briefs: [], answers: [], mostAtOnce: 0 },
    }),
  });
  holder.harness = harness;
  onTestFinished(() => harness.close(), closeMilliseconds);
  return { harness, store };
}
