import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export interface ParentServer {
  origin: string;
  close: () => Promise<void>;
}

function isAddressInfo(address: unknown): address is AddressInfo {
  return typeof address === "object" && address !== null && "port" in address;
}

function closeServer(server: Server): Promise<void> {
  return new Promise((...[resolve, reject]) => {
    server.closeAllConnections();
    server.close((error) => {
      if (error === undefined) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}

export async function startParentServer(
  htmlOf: (origin: string) => string,
): Promise<ParentServer> {
  let origin = "";
  const server = createServer((...parameters) => {
    const [, response] = parameters;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(htmlOf(origin));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!isAddressInfo(address)) {
    await closeServer(server);
    throw new Error("The parent server has no port");
  }
  origin = `http://127.0.0.1:${String(address.port)}`;
  return { origin, close: () => closeServer(server) };
}

export function parentPageHtml(options: {
  previewUrl: string;
  output: { widthPixels: number; heightPixels: number };
  otherFrameUrl: string;
}): string {
  const previewOrigin = new URL(options.previewUrl).origin;
  return [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    "<style>html, body { margin: 0; overflow: hidden; } iframe { border: 0; display: block; }</style>",
    "</head><body>",
    `<iframe id="preview" src="${options.previewUrl.replaceAll("&", "&amp;")}" width="${String(options.output.widthPixels)}" height="${String(options.output.heightPixels)}"></iframe>`,
    `<iframe id="other" src="${options.otherFrameUrl}" width="10" height="10"></iframe>`,
    "<script>",
    `window.addEventListener("message", (event) => { if (event.origin === ${JSON.stringify(previewOrigin)}) { window.deliverReply(event.data); } });`,
    "</script>",
    "</body></html>",
  ].join("");
}
