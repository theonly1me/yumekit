import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, searchForWorkspaceRoot, type Plugin } from "vite";
import { renderPackageDirectory } from "../packagePaths.js";
import { sceneImportsPlugin } from "./sceneImportsPlugin.js";

export interface StageServer {
  origin: string;
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
  pagePlugin: Plugin;
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
    plugins: [
      sceneImportsPlugin({ projectFolder: options.projectFolder }),
      options.pagePlugin,
    ],
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!isAddressInfo(address)) {
    await server.close();
    throw new Error("The stage server has no port");
  }
  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    close: async () => {
      await server.close();
      await rm(cacheDir, { recursive: true, force: true });
    },
  };
}
