import type { Plugin } from "vite";
import { stagePageEntryFile } from "../packagePaths.js";
import type { VideoFrameServer } from "../videoFrames/videoFrameServer.js";
import {
  moduleImporterScript,
  pageHtmlOf,
  sendHtml,
  serveAssetFrames,
} from "./pageResponses.js";

export const stagePagePath = "/stage.html";

export function stagePagePlugin(options: {
  videoFrames: () => VideoFrameServer;
}): Plugin {
  return {
    name: "yumekit-stage-page",
    configureServer(server) {
      server.middlewares.use(stagePagePath, (...parameters) => {
        const [, response] = parameters;
        sendHtml({
          response,
          html: pageHtmlOf({
            entryFile: stagePageEntryFile,
            headScripts: [moduleImporterScript],
          }),
        });
      });
      serveAssetFrames({ server, videoFrames: options.videoFrames });
    },
  };
}
