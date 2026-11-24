import { join } from "node:path";
import type { Asset, Edit, ProjectSnapshot } from "@yumekit/project";
import { probeMedia, saveVideoFrame } from "@yumekit/render";
import { renderFailureOf } from "../output/renderFailures.js";
import type { HarnessFailure, Outcome } from "../results.js";
import { assetFilesFolder, projectFileOf } from "../media/assetFiles.js";

export const endPictureServer = "yumekit";

export const endPictureTool = "save_end_picture";

function freeIdOf(options: {
  snapshot: ProjectSnapshot;
  base: string;
}): string {
  const taken = new Set(options.snapshot.assets.map((asset) => asset.id));
  let candidate = options.base;
  for (let suffix = 2; taken.has(candidate); suffix += 1) {
    candidate = `${options.base}-${String(suffix)}`;
  }
  return candidate;
}

export async function endPictureEditOf(options: {
  snapshot: ProjectSnapshot;
  projectFolder: string;
  clip: Asset;
  seconds: number | undefined;
}): Promise<Outcome<{ edit: Edit; assetId: string }, HarnessFailure>> {
  const { clip, projectFolder } = options;
  const assetId = freeIdOf({
    snapshot: options.snapshot,
    base: `${clip.id.slice(0, 56)}-end`,
  });
  const target = join(assetFilesFolder(projectFolder), `${assetId}.png`);
  const saved = await saveVideoFrame({
    file: join(projectFolder, clip.file),
    ...(options.seconds === undefined ? {} : { seconds: options.seconds }),
    target,
  });
  if (!saved.ok) return { ok: false, failure: renderFailureOf(saved.failure) };
  const probed = await probeMedia({ file: target });
  if (!probed.ok)
    return { ok: false, failure: renderFailureOf(probed.failure) };
  const { widthPixels, heightPixels } = probed.value;
  return {
    ok: true,
    value: {
      assetId,
      edit: {
        kind: "addAsset",
        asset: {
          id: assetId,
          kind: "image",
          label: `End of ${clip.label ?? clip.id}`.slice(0, 200),
          file: projectFileOf({ projectFolder, path: target }),
          ...(widthPixels === undefined ? {} : { widthPixels }),
          ...(heightPixels === undefined ? {} : { heightPixels }),
          source: {
            kind: "tool",
            server: endPictureServer,
            tool: endPictureTool,
            input: {
              video_asset_id: clip.id,
              ...(options.seconds === undefined
                ? {}
                : { seconds: options.seconds }),
            },
          },
        },
      },
    },
  };
}
