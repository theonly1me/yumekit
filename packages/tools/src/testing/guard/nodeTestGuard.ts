import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, inject } from "vitest";
import {
  blockedRequestMessage,
  installFetchGuard,
  takeBlockedRequests,
} from "./fetchGuard.js";
import { removeMediaKeys } from "./removeMediaKeys.js";

removeMediaKeys({
  environment: process.env,
  variables: inject("mediaKeyVariables"),
});

const emptyFolder = mkdtempSync(join(tmpdir(), "yumekit-test-config-"));
process.env["YUMEKIT_CONFIG_DIRECTORY"] = emptyFolder;

installFetchGuard({ base: "http://127.0.0.1/" });

afterEach(() => {
  const [first] = takeBlockedRequests();
  if (first !== undefined) throw new Error(blockedRequestMessage(first));
});

afterAll(() => {
  rmSync(emptyFolder, { recursive: true, force: true });
});
