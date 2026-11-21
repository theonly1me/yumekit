import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const resolveFromRender = createRequire(import.meta.url);
const sourceExtension = import.meta.url.endsWith(".ts") ? ".ts" : ".js";

export const renderPackageDirectory = fileURLToPath(
  new URL("..", import.meta.url),
);

export const stageEntryFile = resolveFromRender.resolve("@yumekit/stage");

export const sceneEntryFile =
  createRequire(stageEntryFile).resolve("@yumekit/scene");

export const sceneTypesFile = sceneEntryFile.replace(/\.js$/, ".d.ts");

export const stagePageEntryFile = fileURLToPath(
  new URL(`page/stagePage${sourceExtension}`, import.meta.url),
);

export const previewPageEntryFile = fileURLToPath(
  new URL(`page/previewPage${sourceExtension}`, import.meta.url),
);
