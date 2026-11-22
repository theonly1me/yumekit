import { saveKey } from "@yumekit/tools";
import {
  keyedServerCommand,
  startHarness,
  type Harness,
} from "./harnessFixture.js";

export function startCastHarness(): Promise<Harness> {
  return startHarness({
    mediaToolsFile: { mcpServers: { sample: {}, keyed: keyedServerCommand } },
    beforeConnect: () =>
      saveKey({ variable: "YUMEKIT_TEST_KEY", value: "made-up-value-7" }),
  });
}

export async function makePictures(options: {
  harness: Harness;
  assetIds: string[];
}): Promise<void> {
  for (const assetId of options.assetIds) {
    await options.harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: assetId,
        capability: "image",
        server: "sample",
        input: { prompt: assetId, width_pixels: 16, height_pixels: 16 },
      },
    });
  }
}

export async function putCastMember(options: {
  harness: Harness;
  castId: string;
  description: string;
  pictureIds: string[];
}): Promise<void> {
  await options.harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: options.castId,
      kind: "person",
      name: options.castId.toUpperCase(),
      description: options.description,
      reference_asset_ids: options.pictureIds,
    },
  });
}
