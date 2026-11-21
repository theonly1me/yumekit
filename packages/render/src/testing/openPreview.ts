import { startPreviewServer, type PreviewServer } from "../index.js";
import { decodePng } from "./decodePng.js";
import {
  openPreviewInParent,
  type PreviewInParent,
  type Reply,
} from "./previewInParent.js";
import { smallOutput } from "./renderProject.js";
import { valueOf } from "./valueOf.js";

export interface OpenPreview {
  server: PreviewServer;
  parent: PreviewInParent;
  seek: (request: { frame: number; requestId: number }) => Promise<Reply>;
  close: () => Promise<void>;
}

export async function openPreview(options: {
  folder: string;
  permittedOrigin?: string;
}): Promise<OpenPreview> {
  const server = valueOf(
    await startPreviewServer({ projectFolder: options.folder }),
  );
  const parent = await openPreviewInParent({
    pageUrl: server.pageUrlOf(smallOutput.id),
    output: smallOutput,
    ...(options.permittedOrigin === undefined
      ? {}
      : { permittedOrigin: options.permittedOrigin }),
  });
  return {
    server,
    parent,
    seek: async (request) => {
      await parent.send({ type: "seek", ...request });
      return parent.waitForReply(
        (reply) =>
          reply.requestId === request.requestId &&
          (reply.type === "sought" || reply.type === "failed"),
      );
    },
    close: async () => {
      await parent.close();
      await server.close();
    },
  };
}

export async function pixelDifferenceOf(options: {
  actual: Uint8Array;
  expected: Uint8Array;
}): Promise<{ differentPixels: number; largestChannelDifference: number }> {
  const actual = await decodePng(options.actual);
  const expected = await decodePng(options.expected);
  if (
    actual.widthPixels !== expected.widthPixels ||
    actual.heightPixels !== expected.heightPixels
  ) {
    throw new Error("The pictures have different sizes");
  }
  let differentPixels = 0;
  let largestChannelDifference = 0;
  for (let y = 0; y < actual.heightPixels; y += 1) {
    for (let x = 0; x < actual.widthPixels; x += 1) {
      const expectedPixel = expected.pixelAt({ x, y });
      const differences = actual
        .pixelAt({ x, y })
        .map((...[channel, index]) =>
          Math.abs(channel - (expectedPixel[index] ?? 0)),
        );
      const largest = Math.max(...differences);
      differentPixels += largest > 0 ? 1 : 0;
      largestChannelDifference = Math.max(largestChannelDifference, largest);
    }
  }
  return { differentPixels, largestChannelDifference };
}
