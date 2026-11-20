import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, searchForWorkspaceRoot } from "vite";
import { renderPackageDirectory } from "../packagePaths.js";
import type { StagePageData } from "../page/stagePageData.js";
import type { VideoFrameServer } from "../videoFrames/videoFrameServer.js";
import { stagePagePath, stagePagePlugin } from "./stagePagePlugin.js";

export interface StageServer {
  origin: string;
  pageUrl: string;
  close: () => Promise<void>;
}

const browserDependencies = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
];

function isAddressInfo(address: unknown): address is AddressInfo {
  return typeof address === "object" && address !== null && "port" in address;
}

export async function startStageServer(options: {
  projectFolder: string;
  pageData: StagePageData;
  videoFrames: VideoFrameServer;
}): Promise<StageServer> {
  const cacheDir = await mkdtemp(join(tmpdir(), "yumekit-render-"));
  const server = await createServer({
    configFile: false,
    envFile: false,
    root: renderPackageDirectory,
    cacheDir,
    logLevel: "silent",
    appType: "custom",
    clearScreen: false,
    server: {
      host: "127.0.0.1",
      port: 0,
      hmr: false,
      ws: false,
      watch: null,
      fs: {
        strict: true,
        allow: [
          searchForWorkspaceRoot(renderPackageDirectory),
          options.projectFolder,
          cacheDir,
        ],
      },
    },
    optimizeDeps: { noDiscovery: true, include: browserDependencies },
    oxc: { jsx: { runtime: "automatic", development: false } },
    plugins: [stagePagePlugin(options)],
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!isAddressInfo(address)) {
    await server.close();
    throw new Error("The stage server has no port");
  }
  const origin = `http://127.0.0.1:${String(address.port)}`;
  return {
    origin,
    pageUrl: `${origin}${stagePagePath}`,
    close: async () => {
      await server.close();
      await rm(cacheDir, { recursive: true, force: true });
    },
  };
}
