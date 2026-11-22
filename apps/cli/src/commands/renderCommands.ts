import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderOutputFiles } from "@yumekit/harness-mcp";
import { openProject } from "@yumekit/project";
import {
  renderFrame,
  type RenderFailure,
  type RenderScale,
} from "@yumekit/render";
import { failed, usageError, type CommandResult } from "../commandResult.js";
import {
  parseCommandLine,
  scaleOption,
  stringOption,
  wholeNumberOption,
  type Parsed,
} from "../options.js";

const renderConfig = {
  project: { type: "string" },
  output: { type: "string" },
  scale: { type: "string" },
  "first-frame": { type: "string" },
  "frame-count": { type: "string" },
  frame: { type: "string" },
} as const;

function failureText(failure: RenderFailure): string {
  return failure.hint === undefined
    ? failure.message
    : `${failure.message}\n${failure.hint}`;
}

interface RenderRequest {
  folder: string;
  outputId: string;
  scale: RenderScale | undefined;
  firstFrame: number | undefined;
  frameCount: number | undefined;
  frame: number | undefined;
}

function parseRenderRequest(args: string[]): Parsed<RenderRequest> {
  const parsed = parseCommandLine({ args, config: renderConfig });
  if (!parsed.ok) return parsed;
  const { values } = parsed.value;
  const project = stringOption({ values, name: "project" });
  const outputId = stringOption({ values, name: "output" });
  if (project === undefined || outputId === undefined) {
    return { ok: false, message: "Give --project <folder> and --output <id>." };
  }
  const scale = scaleOption(values);
  if (!scale.ok) return scale;
  const firstFrame = wholeNumberOption({ values, name: "first-frame" });
  if (!firstFrame.ok) return firstFrame;
  const frameCount = wholeNumberOption({ values, name: "frame-count" });
  if (!frameCount.ok) return frameCount;
  const frame = wholeNumberOption({ values, name: "frame" });
  if (!frame.ok) return frame;
  return {
    ok: true,
    value: {
      folder: resolve(project),
      outputId,
      scale: scale.value,
      firstFrame: firstFrame.value,
      frameCount: frameCount.value,
      frame: frame.value,
    },
  };
}

export async function renderCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseRenderRequest(args);
  if (!parsed.ok) return usageError(parsed.message);
  const request = parsed.value;
  const opened = await openProject({ folder: request.folder });
  if (!opened.ok) return failed(opened.failure.message);
  let reportedTenth = -1;
  const rendered = await renderOutputFiles({
    snapshot: opened.value.read(),
    folder: request.folder,
    outputId: request.outputId,
    ...(request.scale === undefined ? {} : { scale: request.scale }),
    ...(request.firstFrame === undefined
      ? {}
      : { firstFrame: request.firstFrame }),
    ...(request.frameCount === undefined
      ? {}
      : { frameCount: request.frameCount }),
    onProgress: ({ framesDone, frameCount }) => {
      const tenth = Math.floor((framesDone / frameCount) * 10);
      if (tenth === reportedTenth) return;
      reportedTenth = tenth;
      process.stderr.write(
        `Rendered ${String(framesDone)} of ${String(frameCount)} frames\n`,
      );
    },
  });
  if (!rendered.ok) return failed(failureText(rendered.failure));
  const lines = rendered.value.files.map((entry) => `${entry.file}\n`);
  return { kind: "done", output: lines.join("") };
}

export async function frameCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseRenderRequest(args);
  if (!parsed.ok) return usageError(parsed.message);
  const request = parsed.value;
  if (request.frame === undefined)
    return usageError("frame needs --frame <n>.");
  const rendered = await renderFrame({
    folder: request.folder,
    outputId: request.outputId,
    frame: request.frame,
    ...(request.scale === undefined ? {} : { scale: request.scale }),
  });
  if (!rendered.ok) return failed(failureText(rendered.failure));
  const rendersFolder = join(request.folder, "renders");
  const file = join(
    rendersFolder,
    `${request.outputId}-frame-${String(request.frame)}.png`,
  );
  await mkdir(rendersFolder, { recursive: true });
  await writeFile(file, rendered.value.png);
  return { kind: "done", output: `${file}\n` };
}
