import type { BrowserStagePage } from "../browser/openStagePage.js";
import { fail, succeed, type Outcome } from "../outcome.js";
import { checkModuleScenes } from "../project/checkModuleScenes.js";
import { loadOutput, type LoadedOutput } from "../project/loadOutput.js";
import { sceneAloneOf } from "../project/sceneAlone.js";
import type { RenderFailure, RenderScale } from "../renderFailure.js";
import {
  checkFrames,
  drawStills,
  type RenderedFrame,
} from "../session/drawStills.js";
import { loadStagePage } from "../session/loadStagePage.js";
import type { StageHost } from "../session/stageHost.js";
import type { PageSize } from "./keptStage.js";

export type PictureRequest =
  | { kind: "frames"; outputId: string; frames: number[]; scale?: RenderScale }
  | {
      kind: "scenes";
      outputId: string;
      sceneIds: string[];
      durationFrames: number;
      frame: number;
      scale?: RenderScale;
    };

type Pictures = Outcome<RenderedFrame[], RenderFailure>;

export type OnStage = <Value>(work: {
  size: PageSize;
  draw: (stage: {
    host: StageHost;
    page: BrowserStagePage;
  }) => Promise<Outcome<Value, RenderFailure>>;
}) => Promise<Outcome<Value, RenderFailure>>;

interface Job {
  loaded: LoadedOutput;
  frames: number[];
}

function jobsOf(options: {
  loaded: LoadedOutput;
  request: PictureRequest;
}): Outcome<Job[], RenderFailure> {
  const { loaded, request } = options;
  if (request.kind === "frames") {
    return succeed([{ loaded, frames: request.frames }]);
  }
  const jobs: Job[] = [];
  for (const sceneId of request.sceneIds) {
    const alone = sceneAloneOf({
      loaded,
      sceneId,
      durationFrames: request.durationFrames,
    });
    if (!alone.ok) return alone;
    jobs.push({ loaded: alone.value, frames: [request.frame] });
  }
  return succeed(jobs);
}

function checkJob(job: Job): RenderFailure | undefined {
  return (
    checkFrames({
      frames: job.frames,
      outputFrameCount: job.loaded.frameCount,
    }) ?? checkModuleScenes(job.loaded)
  );
}

export async function drawPictures(options: {
  folder: string;
  request: PictureRequest;
  onStage: OnStage;
}): Promise<Pictures> {
  const { request } = options;
  const loaded = await loadOutput({
    folder: options.folder,
    outputId: request.outputId,
  });
  if (!loaded.ok) return loaded;
  const jobs = jobsOf({ loaded: loaded.value, request });
  if (!jobs.ok) return jobs;
  const jobFailure = jobs.value.map(checkJob).find((failure) => failure);
  if (jobFailure !== undefined) return fail(jobFailure);
  return options.onStage({
    size: { output: loaded.value.output, scale: request.scale ?? 1 },
    draw: async ({ host, page }) => {
      const pictures: RenderedFrame[] = [];
      for (const job of jobs.value) {
        const stagePage = await loadStagePage({
          host,
          page,
          loaded: job.loaded,
        });
        const drawn = await drawStills({ stagePage, frames: job.frames });
        if (!drawn.ok) return drawn;
        pictures.push(...drawn.value);
      }
      return succeed(pictures);
    },
  });
}
