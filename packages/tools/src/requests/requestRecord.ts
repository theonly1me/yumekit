import { basename, isAbsolute, relative, sep } from "node:path";
import type { CostBasis } from "../spending/ledger.js";
import type { JsonObject, MediaToolRequest, MediaToolRun } from "../types.js";
import type { MediaRequestRecord, PictureRole } from "./requestFile.js";

export type CallOutcome =
  | { kind: "made"; run: MediaToolRun }
  | {
      kind: "failed";
      failure: { kind: string; message: string };
      server?: string | undefined;
      model?: string | undefined;
      charged?: { usd: number; basis: CostBasis } | undefined;
    };

const pictureFields: { field: string; role: PictureRole }[] = [
  { field: "first_frame_path", role: "first-frame" },
  { field: "last_frame_path", role: "last-frame" },
  { field: "reference_image_paths", role: "reference" },
  { field: "media_path", role: "media" },
];

const fieldsOutsideSettings = new Set([
  "prompt",
  "text",
  "model",
  "audio_path",
  "output_directory",
  "file_stem",
  ...pictureFields.map((picture) => picture.field),
]);

export type FileOf = (path: string) => string;

export function projectFileOf(options: {
  projectFolders: string[];
  path: string;
}): string {
  const inside = options.projectFolders
    .map((folder) => relative(folder, options.path))
    .find((path) => !path.startsWith("..") && !isAbsolute(path));
  return inside === undefined
    ? basename(options.path)
    : inside.split(sep).join("/");
}

function picturePathsOf(input: JsonObject) {
  return pictureFields.flatMap(({ field, role }) => {
    const value = input[field];
    const paths = Array.isArray(value) ? value : [value];
    return paths
      .filter((path) => typeof path === "string")
      .map((path) => ({ role, path }));
  });
}

export function pathsOf(options: {
  request: MediaToolRequest;
  outcome: CallOutcome;
}): string[] {
  const { outcome } = options;
  return [
    ...picturePathsOf(options.request.input).map((picture) => picture.path),
    ...(outcome.kind === "made"
      ? outcome.run.result.files.map((file) => file.path)
      : []),
  ];
}

function settingsOf(
  input: JsonObject,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(input).flatMap(([name, value]) =>
      fieldsOutsideSettings.has(name) ||
      (typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean")
        ? []
        : [[name, value]],
    ),
  );
}

function promptOf(request: MediaToolRequest) {
  const written = request.input["prompt"] ?? request.input["text"];
  return typeof written === "string" ? { prompt_from_you: written } : {};
}

function outcomeFieldsOf(options: { fileOf: FileOf; outcome: CallOutcome }) {
  const { outcome } = options;
  if (outcome.kind === "failed") {
    return {
      ...(outcome.server === undefined ? {} : { server: outcome.server }),
      ...(outcome.model === undefined ? {} : { model: outcome.model }),
      ...(outcome.charged === undefined
        ? {}
        : { usd: outcome.charged.usd, basis: outcome.charged.basis }),
      failure: outcome.failure,
    };
  }
  const { run } = outcome;
  return {
    server: run.server,
    ...(run.model === undefined ? {} : { model: run.model }),
    ...(run.cost === undefined
      ? {}
      : { usd: run.cost.usd, basis: run.cost.basis }),
    files: run.result.files.map((file) => options.fileOf(file.path)),
  };
}

export function requestRecordOf(options: {
  fileOf: FileOf;
  request: MediaToolRequest;
  startedAt: Date;
  endedAt: Date;
  outcome: CallOutcome;
}): MediaRequestRecord {
  const { request, fileOf } = options;
  const seconds =
    Math.round(
      (options.endedAt.getTime() - options.startedAt.getTime()) / 100,
    ) / 10;
  return {
    at: options.startedAt.toISOString(),
    seconds: Math.max(0, seconds),
    capability: request.capability,
    asset_id: request.fileStem,
    ...(request.about?.shotId === undefined
      ? {}
      : { shot_id: request.about.shotId }),
    ...(request.server === undefined ? {} : { server: request.server }),
    ...(request.model === undefined ? {} : { model: request.model }),
    ...promptOf(request),
    pictures: picturePathsOf(request.input).map((picture) => ({
      role: picture.role,
      file: fileOf(picture.path),
    })),
    settings: settingsOf(request.input),
    ...outcomeFieldsOf({ fileOf, outcome: options.outcome }),
  };
}
