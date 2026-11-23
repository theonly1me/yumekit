import { beatOfFrame, tempoGridOf, type Project } from "@yumekit/project";

function roundedTenth(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function frameLabelOf(options: {
  project: Project;
  frame: number;
  isNarrow: boolean;
}): string {
  const { project, frame, isNarrow } = options;
  const seconds = (frame / project.framesPerSecond).toFixed(1);
  const grid = tempoGridOf(project);
  const beat =
    grid === undefined ? undefined : roundedTenth(beatOfFrame({ grid, frame }));
  if (isNarrow) {
    return `${seconds}s f${String(frame)}${beat === undefined ? "" : ` b${beat}`}`;
  }
  return `${seconds} s · frame ${String(frame)}${beat === undefined ? "" : ` · beat ${beat}`}`;
}

export function sheetTitleOf(options: {
  project: Project;
  output: { id: string; widthPixels: number; heightPixels: number };
  frames: number[];
  isNarrow: boolean;
}): string {
  const { project, output, frames } = options;
  const legend = options.isNarrow ? " · s seconds, f frame, b beat" : "";
  const tempo =
    project.tempo === undefined ? "" : ` · ${String(project.tempo)} BPM`;
  return `${project.name} · ${output.id} ${String(output.widthPixels)}×${String(output.heightPixels)} · ${String(frames.length)} frames${tempo}${legend}`;
}
