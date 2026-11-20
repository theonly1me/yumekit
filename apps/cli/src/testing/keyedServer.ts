import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const testKeyValue = "made-up-cli-test-key-5b81e2";

export const keyedServerEntry = {
  command: process.execPath,
  args: [
    fileURLToPath(
      new URL(
        "../../../../packages/tools/src/testing/keyedMediaServer.ts",
        import.meta.url,
      ),
    ),
  ],
  passEnvironment: ["YUMEKIT_TEST_KEY"],
};

export async function writeUserMediaTools(options: {
  configurationDirectory: string;
  content: object;
}): Promise<void> {
  await mkdir(options.configurationDirectory, { recursive: true });
  await writeFile(
    join(options.configurationDirectory, "media-tools.json"),
    JSON.stringify(options.content),
  );
}
