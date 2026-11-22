import { join } from "node:path";
import { fileInside } from "../files/fileInside.js";
import { sendFile } from "../files/sendFile.js";
import { downloadDispositionOf } from "../uploads/downloadName.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { notFound, type Failure } from "./responses.js";

const filePolicy = "default-src 'none'; sandbox";

async function sendFileInside(options: {
  exchange: Exchange;
  folder: string;
  segments: string[];
}): Promise<Failure | undefined> {
  const file = await fileInside({
    folder: options.folder,
    segments: options.segments,
  });
  if (file === undefined) return notFound("The project has no such file.");
  await sendFile({
    request: options.exchange.request,
    response: options.exchange.response,
    file,
    contentSecurityPolicy: filePolicy,
  });
  return undefined;
}

export const fileRoutes: Route[] = [
  {
    method: "GET",
    pattern: ["api", "assets", anySegment, "file"],
    handle: (exchange) => {
      const [assetId] = exchange.parameters;
      const { context } = exchange;
      const asset = context.store
        .read()
        .assets.find((candidate) => candidate.id === assetId);
      if (asset === undefined) {
        return Promise.resolve(notFound("The project has no such asset."));
      }
      if (exchange.query.get("download") === "1") {
        exchange.response.setHeader(
          "Content-Disposition",
          downloadDispositionOf(asset),
        );
      }
      return sendFileInside({
        exchange,
        folder: context.projectFolder,
        segments: asset.file.split("/"),
      });
    },
  },
  {
    method: "GET",
    pattern: ["api", "renders", anySegment],
    handle: (exchange) =>
      sendFileInside({
        exchange,
        folder: join(exchange.context.projectFolder, "renders"),
        segments: exchange.parameters,
      }),
  },
];
