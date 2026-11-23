import type { ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import {
  assetFramesPath,
  type VideoFrameServer,
} from "../videoFrames/videoFrameServer.js";

export const moduleImporterScript =
  "<script>window.yumekitImport = (url) => import(url);</script>";

export function pageHtmlOf(options: {
  entryFile: string;
  headScripts?: string[];
}): string {
  const { entryFile, headScripts = [] } = options;
  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    "<style>html, body { margin: 0; background: #000000; overflow: hidden; }</style>",
    ...headScripts,
    '</head><body><div id="stage"></div>',
    `<script type="module" src="/@fs${encodeURI(entryFile)}"></script>`,
    "</body></html>",
  ].join("");
}

export function sendHtml(options: {
  response: ServerResponse;
  html: string;
}): void {
  options.response.setHeader("Content-Type", "text/html; charset=utf-8");
  options.response.end(options.html);
}

export function serveAssetFrames(options: {
  server: ViteDevServer;
  videoFrames: () => VideoFrameServer;
}): void {
  options.server.middlewares.use(assetFramesPath, (...parameters) => {
    const [request, response, next] = parameters;
    options.videoFrames().respond({ request, response }).catch(next);
  });
}
