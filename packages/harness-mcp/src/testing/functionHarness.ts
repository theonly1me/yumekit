import type { ProjectStore } from "@yumekit/project";
import { onTestFinished } from "vitest";
import { createHarness, type Harness } from "../index.js";
import {
  startHarnessProject,
  type HarnessProjectOptions,
} from "./harnessProject.js";

export interface FunctionHarness {
  harness: Harness;
  store: ProjectStore;
}

export async function startFunctionHarness(
  options?: HarnessProjectOptions,
): Promise<FunctionHarness> {
  const { store, mediaTools } = await startHarnessProject(options);
  const harness = createHarness({ store, mediaTools });
  onTestFinished(() => harness.close());
  return { harness, store };
}
