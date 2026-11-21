import { fileURLToPath } from "node:url";
import { build } from "vite";

const editorFolder = fileURLToPath(new URL("../..", import.meta.url));

export default async function buildEditor(): Promise<void> {
  await build({ root: editorFolder, logLevel: "error" });
}
