import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectSnapshot } from "@yumekit/project";
import {
  renderVideo,
  type Outcome,
  type RenderedVideo,
  type RenderFailure,
  type RenderVideoOptions,
} from "@yumekit/render";
import {
  linkOrCopy,
  platformFilesOf,
  smallerFileSuffixOf,
  type PlatformFile,
} from "./platformFiles.js";

export interface RenderedOutputFiles {
  video: RenderedVideo;
  files: [PlatformFile, ...PlatformFile[]];
}

export type RenderOutputFilesOptions = Omit<
  RenderVideoOptions,
  "destination"
> & { snapshot: ProjectSnapshot };

export async function renderOutputFiles(
  options: RenderOutputFilesOptions,
): Promise<Outcome<RenderedOutputFiles, RenderFailure>> {
  const { snapshot, ...request } = options;
  const [first, ...others] = platformFilesOf({
    snapshot,
    outputId: request.outputId,
    rendersFolder: join(request.folder, "renders"),
    ...(request.smallerFile === undefined
      ? {}
      : { suffix: smallerFileSuffixOf(request.smallerFile.largestMegabytes) }),
  });
  await rm(first.file, { force: true });
  const rendered = await renderVideo({ ...request, destination: first.file });
  if (!rendered.ok) return rendered;
  const video = rendered.value;
  for (const other of others) {
    await linkOrCopy({ from: video.file, to: other.file });
  }
  return {
    ok: true,
    value: { video, files: [{ ...first, file: video.file }, ...others] },
  };
}
