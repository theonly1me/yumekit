import { readMediaToolsConfiguration } from "./configuration.js";
import type { ConnectFailure, MediaLimits, Outcome } from "./types.js";

export async function readUserLimits(): Promise<
  Outcome<MediaLimits, ConnectFailure>
> {
  const read = await readMediaToolsConfiguration({
    projectFolder: undefined,
    bundledServers: {},
  });
  return read.ok ? { ok: true, value: read.value.limits } : read;
}
