import type { ExportScale } from "./exportJobs.js";
import type { ExportRow } from "./exportRows.js";
import type { SizedVideo } from "./fileSize/fileSizeChoice.js";

export function rendersFolderOf(projectFolder: string): string {
  const separator = projectFolder.includes("\\") ? "\\" : "/";
  return `${projectFolder.replace(/[\\/]+$/, "")}${separator}renders`;
}

export function shortRendersFolderOf(projectFolder: string): string {
  const folderName =
    projectFolder
      .split(/[\\/]+/)
      .filter((part) => part !== "")
      .at(-1) ?? "";
  return `${folderName}/renders`;
}

export function longestVideoOf(options: {
  rows: ExportRow[];
  scale: ExportScale;
  framesPerSecond: number;
}): SizedVideo | undefined {
  const [longest] = options.rows.toSorted(
    (...[first, second]) => second.lengthFrames - first.lengthFrames,
  );
  if (longest === undefined) return undefined;
  return {
    seconds: longest.lengthFrames / options.framesPerSecond,
    size: {
      widthPixels: Math.round(longest.output.widthPixels * options.scale),
      heightPixels: Math.round(longest.output.heightPixels * options.scale),
    },
    framesPerSecond: options.framesPerSecond,
  };
}

export function withKey(options: {
  keys: ReadonlySet<string>;
  key: string;
  isIn: boolean;
}): ReadonlySet<string> {
  const next = new Set(options.keys);
  if (options.isIn) next.add(options.key);
  else next.delete(options.key);
  return next;
}
