import { fail, succeed, type Outcome } from "../outcome.js";
import type { FrameFindings } from "../page/frameFindings.js";
import type { OnStage } from "../pictures/drawPictures.js";
import { checkModuleScenes } from "../project/checkModuleScenes.js";
import { loadOutput } from "../project/loadOutput.js";
import type { RenderFailure } from "../renderFailure.js";
import { drawFrame } from "../session/drawFrame.js";
import { checkFrames } from "../session/drawStills.js";
import { loadStagePage } from "../session/loadStagePage.js";
import { frameLabelOf, sheetTitleOf } from "./frameLabels.js";
import { sheetHtmlOf, sheetSizeOf } from "./sheetHtml.js";
import { sheetLayoutOf } from "./sheetLayout.js";
import { oneColorFramesOf } from "./oneColorFrames.js";

export interface ContactSheetRequest {
  outputId: string;
  frames: number[];
  columns?: number;
}

export interface SheetFrame extends FrameFindings {
  frame: number;
  oneColor: string | undefined;
}

export interface ContactSheet {
  png: Uint8Array;
  widthPixels: number;
  heightPixels: number;
  frames: SheetFrame[];
}

const narrowCellPixels = 240;

interface DrawnFrame {
  frame: number;
  png: Uint8Array;
  findings: FrameFindings;
}

function isFlagged(options: {
  findings: FrameFindings;
  oneColor: string | undefined;
}): boolean {
  const { findings } = options;
  return (
    options.oneColor !== undefined ||
    findings.textOutside.length > 0 ||
    findings.firstFrameVideos.length > 0
  );
}

export async function drawContactSheet(options: {
  folder: string;
  request: ContactSheetRequest;
  onStage: OnStage;
}): Promise<Outcome<ContactSheet, RenderFailure>> {
  const { request } = options;
  const loaded = await loadOutput({
    folder: options.folder,
    outputId: request.outputId,
  });
  if (!loaded.ok) return loaded;
  const output = loaded.value;
  const failure =
    checkFrames({
      frames: request.frames,
      outputFrameCount: output.frameCount,
    }) ?? checkModuleScenes(output);
  if (failure !== undefined) return fail(failure);
  const layout = sheetLayoutOf({
    output: output.output,
    count: request.frames.length,
    ...(request.columns === undefined ? {} : { columns: request.columns }),
  });
  return options.onStage({
    size: { output: output.output, scale: layout.scale },
    draw: async ({ host, page }) => {
      const stagePage = await loadStagePage({ host, page, loaded: output });
      const drawn: DrawnFrame[] = [];
      for (const frame of request.frames) {
        const picture = await drawFrame({ stagePage, frame, use: "video" });
        if (!picture.ok) return picture;
        drawn.push({
          frame,
          png: picture.value,
          findings: await stagePage.inspect(),
        });
      }
      const project = output.snapshot.project;
      const oneColors = await oneColorFramesOf({
        host,
        stagePage,
        pictures: drawn,
        frameCount: output.frameCount,
        framesPerSecond: project.framesPerSecond,
      });
      if (!oneColors.ok) return oneColors;
      const size = sheetSizeOf(layout);
      const png = await host.drawSheet({
        size,
        html: sheetHtmlOf({
          layout,
          title: sheetTitleOf({
            project,
            output: output.output,
            frames: request.frames,
            isNarrow: layout.cellWidth < narrowCellPixels,
          }),
          cells: drawn.map((...[cell, index]) => ({
            png: cell.png,
            label: frameLabelOf({
              project,
              frame: cell.frame,
              isNarrow: layout.cellWidth < narrowCellPixels,
            }),
            isFlagged: isFlagged({
              findings: cell.findings,
              oneColor: oneColors.value[index],
            }),
          })),
        }),
      });
      return succeed({
        png,
        ...size,
        frames: drawn.map((...[cell, index]) => ({
          frame: cell.frame,
          ...cell.findings,
          oneColor: oneColors.value[index],
        })),
      });
    },
  });
}
