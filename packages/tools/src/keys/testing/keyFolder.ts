import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { onTestFinished, vi } from "vitest";

export async function useTemporaryKeyFolder(): Promise<{
  configurationDirectory: string;
  keyFile: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "yumekit-keys-"));
  const configurationDirectory = join(root, "config", "yumekit");
  vi.stubEnv("YUMEKIT_CONFIG_DIRECTORY", configurationDirectory);
  onTestFinished(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  return {
    configurationDirectory,
    keyFile: join(configurationDirectory, "keys.json"),
  };
}
