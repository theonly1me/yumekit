import type { Plugin } from "vite";
import { previewPageEntryFile } from "../packagePaths.js";
import {
  previewDataPath,
  previewEventsPath,
  previewPagePath,
} from "../page/previewData.js";
import {
  pageHtmlOf,
  sendHtml,
  serveAssetFrames,
} from "../server/pageResponses.js";
import type { PreviewEvents } from "./previewEvents.js";
import type { PreviewState } from "./previewState.js";

function outputIdOf(url: string | undefined): string {
  return new URL(url ?? "/", "http://preview").searchParams.get("output") ?? "";
}

export function previewPagePlugin(options: {
  state: PreviewState;
  events: PreviewEvents;
}): Plugin {
  const { state, events } = options;
  return {
    name: "yumekit-preview-page",
    configureServer(server) {
      server.middlewares.use(previewPagePath, (...parameters) => {
        const [, response] = parameters;
        sendHtml({
          response,
          html: pageHtmlOf({ entryFile: previewPageEntryFile }),
        });
      });
      server.middlewares.use(previewDataPath, (...parameters) => {
        const [request, response, next] = parameters;
        state
          .previewDataOf(outputIdOf(request.url))
          .then((data) => {
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            response.end(JSON.stringify(data));
          })
          .catch(next);
      });
      server.middlewares.use(previewEventsPath, (...parameters) => {
        const [, response] = parameters;
        events.connect(response);
      });
      serveAssetFrames({ server, videoFrames: state.videoFrames });
    },
  };
}
