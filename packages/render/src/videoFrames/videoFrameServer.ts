import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { Asset } from "@yumekit/project";
import type { Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { pictureFileOf } from "./convertVideo.js";
import {
  prepareFramePictures,
  type FramePictureFolder,
} from "./framePictureFolder.js";

export const assetFramesPath = "/asset-frames/";

export function assetFramesUrlPrefixOf(assetId: string): string {
  return `${assetFramesPath}${encodeURIComponent(assetId)}/`;
}

export interface VideoFrameServer {
  respond: (options: {
    request: IncomingMessage;
    response: ServerResponse;
  }) => Promise<void>;
  failure: () => RenderFailure | undefined;
}

type Preparation = Promise<Outcome<FramePictureFolder, RenderFailure>>;

function parseRequest(
  url: string | undefined,
): { assetId: string; assetFrame: number } | undefined {
  const match = /^\/([^/]+)\/(\d+)\.jpg$/.exec(url ?? "");
  const [, assetId, assetFrame] = match ?? [];
  return assetId === undefined || assetFrame === undefined
    ? undefined
    : { assetId: decodeURIComponent(assetId), assetFrame: Number(assetFrame) };
}

function endWithStatus(options: {
  response: ServerResponse;
  statusCode: number;
}): void {
  options.response.statusCode = options.statusCode;
  options.response.end();
}

export function createVideoFrameServer(options: {
  projectFolder: string;
  framesPerSecond: number;
  assets: Asset[];
}): VideoFrameServer {
  const videoAssets = new Map(
    options.assets
      .filter((asset) => asset.kind === "video")
      .map((asset) => [asset.id, asset]),
  );
  const preparations = new Map<string, Preparation>();
  let firstFailure: RenderFailure | undefined;
  const prepare = (asset: Asset): Preparation => {
    const started =
      preparations.get(asset.id) ??
      prepareFramePictures({
        projectFolder: options.projectFolder,
        asset,
        framesPerSecond: options.framesPerSecond,
      });
    preparations.set(asset.id, started);
    return started;
  };
  return {
    respond: async ({ request, response }) => {
      const requested = parseRequest(request.url);
      const asset =
        requested === undefined
          ? undefined
          : videoAssets.get(requested.assetId);
      if (requested === undefined || asset === undefined) {
        endWithStatus({ response, statusCode: 404 });
        return;
      }
      const prepared = await prepare(asset);
      if (!prepared.ok) {
        firstFailure ??= prepared.failure;
        endWithStatus({ response, statusCode: 500 });
        return;
      }
      if (requested.assetFrame >= prepared.value.pictureCount) {
        endWithStatus({ response, statusCode: 404 });
        return;
      }
      const picture = await readFile(
        join(prepared.value.folder, pictureFileOf(requested.assetFrame + 1)),
      );
      response.setHeader("Content-Type", "image/jpeg");
      response.end(picture);
    },
    failure: () => firstFailure,
  };
}
