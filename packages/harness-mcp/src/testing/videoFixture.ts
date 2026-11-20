import type { Harness } from "./harnessFixture.js";

export function generateVideo(options: {
  harness: Harness;
  assetId: string;
  seconds: number;
  withAudio?: boolean;
  firstFrameAssetId?: string;
}) {
  return options.harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: options.assetId,
      capability: "video",
      input: {
        prompt: `clip ${options.assetId}`,
        duration_seconds: options.seconds,
        ...(options.withAudio === undefined
          ? {}
          : { with_audio: options.withAudio }),
      },
      ...(options.firstFrameAssetId === undefined
        ? {}
        : { first_frame_asset_id: options.firstFrameAssetId }),
    },
  });
}

export function sampleWithVideoLimit(generatedVideoSeconds: number) {
  return {
    mcpServers: { sample: {} },
    limits: { generatedVideoSeconds },
  };
}
