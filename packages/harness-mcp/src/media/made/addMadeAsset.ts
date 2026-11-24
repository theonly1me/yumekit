import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  assetLabelOf,
  type Edit,
  type JsonObject,
  type ProjectSnapshot,
} from "@yumekit/project";
import type { MediaToolRun } from "@yumekit/tools";
import { applyEditsResult } from "../../applyEditsResult.js";
import type { HarnessContext } from "../../context.js";
import { failureResult } from "../../results.js";
import {
  assetFilesFolder,
  framesOfSeconds,
  projectFileOf,
  wordsInFrames,
} from "../assetFiles.js";
import type { GenerateAssetInput } from "../generateAssetInput.js";
import { generatedMediaOf } from "../generatedFile.js";
import { summaryOf } from "../reuseAsset.js";
import { wordsOfResult } from "../spreadWords.js";
import { costTextOf, sourceCostOf, wireCostOf } from "./costFields.js";
import { fitToAskedLength, lengthNoteOf } from "./fitAudio.js";
import { sizeNoteOf } from "./sizeNote.js";

export async function addMadeAsset(options: {
  context: HarnessContext;
  request: GenerateAssetInput;
  snapshot: ProjectSnapshot;
  run: MediaToolRun;
  tool: string;
  input: JsonObject;
  notes?: string[];
}): Promise<CallToolResult> {
  const { context, request, snapshot, run, tool, input } = options;
  const { server, model, result } = run;
  const [file] = result.files;
  if (file === undefined) {
    return failureResult({
      kind: "media-tool-invalid-result",
      message: `The media server "${server}" returned no file.`,
      hint: "Call again, or use another server from list_media_tools.",
    });
  }
  const projectFolder = context.store.folder;
  const { framesPerSecond } = snapshot.project;
  const media = await generatedMediaOf({ file, server, framesPerSecond });
  if (!media.ok) return failureResult(media.failure);
  const length = await fitToAskedLength({
    capability: request.capability,
    input: request.input,
    path: file.path,
    reportedSeconds: file.duration_seconds,
    assetFolder: assetFilesFolder(projectFolder),
    fileStem: request.asset_id,
  });
  if (!length.ok) return failureResult(length.failure);
  const { fit, realSeconds } = length.value;
  const durationFrames =
    fit === undefined
      ? media.value.durationFrames
      : framesOfSeconds({ seconds: fit.seconds, framesPerSecond });
  const asset = {
    id: request.asset_id,
    kind: file.kind,
    label: assetLabelOf({ kind: file.kind, source: { kind: "tool", input } }),
    file: projectFileOf({ projectFolder, path: length.value.path }),
    ...media.value,
    ...(durationFrames === undefined ? {} : { durationFrames }),
    source: {
      kind: "tool" as const,
      server,
      tool,
      ...(model === undefined ? {} : { model }),
      input,
      ...sourceCostOf(run),
      ...(fit === undefined
        ? {}
        : {
            fit: {
              originalFile: projectFileOf({
                projectFolder,
                path: fit.originalPath,
              }),
              seconds: fit.seconds,
              fadeOutSeconds: fit.fadeOutSeconds,
            },
          }),
    },
  };
  const words = await wordsOfResult({
    capability: request.capability,
    input: request.input,
    result,
    path: length.value.path,
    serverCanAlign: context.mediaTools
      .list()
      .some(
        (entry) =>
          entry.server === server && entry.capabilities.includes("align"),
      ),
    durationSeconds:
      durationFrames === undefined
        ? undefined
        : durationFrames / framesPerSecond,
  });
  const edit: Edit = {
    kind: "addAsset",
    asset,
    ...(words === undefined
      ? {}
      : { words: wordsInFrames({ words, framesPerSecond }) }),
  };
  const chosenModel = await context.mediaTools.chosenModel({
    capability: request.capability,
    server,
    ...(model === undefined ? {} : { model }),
  });
  const notes = [
    ...(options.notes ?? []),
    lengthNoteOf(length.value),
    sizeNoteOf({
      input: request.input,
      widthPixels: media.value.widthPixels,
      heightPixels: media.value.heightPixels,
      model: chosenModel,
    }),
  ].filter((note) => note !== undefined);
  const lengthText =
    durationFrames === undefined
      ? ""
      : `, ${String(durationFrames)} frames long`;
  const wordsText =
    words === undefined ? "" : `, with ${String(words.length)} word timings`;
  return applyEditsResult({
    store: context.store,
    edits: [edit],
    line: [
      `Asset "${request.asset_id}" made by ${server}${lengthText}${wordsText}.`,
      costTextOf(run),
      ...notes,
    ].join(" "),
    data: {
      ...summaryOf({
        asset: { ...asset, hasWords: words !== undefined },
        reused: false,
      }),
      ...wireCostOf(run),
      ...(media.value.widthPixels === undefined
        ? {}
        : { width_pixels: media.value.widthPixels }),
      ...(media.value.heightPixels === undefined
        ? {}
        : { height_pixels: media.value.heightPixels }),
      ...(realSeconds === undefined ? {} : { real_seconds: realSeconds }),
      ...(length.value.originalSeconds === undefined
        ? {}
        : { original_seconds: length.value.originalSeconds, fitted: true }),
      ...(notes.length === 0 ? {} : { notes }),
    },
  });
}
