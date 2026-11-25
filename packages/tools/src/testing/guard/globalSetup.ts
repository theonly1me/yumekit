import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { mediaKeyVariablesOf } from "./mediaKeyVariables.js";
import { removeMediaKeys } from "./removeMediaKeys.js";

export default async function setup(project: TestProject) {
  const emptyFolder = await mkdtemp(join(tmpdir(), "yumekit-test-config-"));
  process.env["YUMEKIT_CONFIG_DIRECTORY"] = emptyFolder;
  const variables = await mediaKeyVariablesOf();
  removeMediaKeys({ environment: process.env, variables });
  project.provide("mediaKeyVariables", variables);
  return async () => {
    await rm(emptyFolder, { recursive: true, force: true });
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    mediaKeyVariables: string[];
  }
}
