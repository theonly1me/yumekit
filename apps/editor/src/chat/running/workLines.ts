import type { WorkItem } from "./workSchema.js";

export interface WorkLine {
  key: string;
  text: string;
  service: string | undefined;
  state: WorkItem["state"];
  seconds: number;
}

function capitalized(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function subjectOf(item: WorkItem): string {
  if (item.shotId !== undefined) return ` of shot "${item.shotId}"`;
  if (item.castId !== undefined) return ` for "${item.castId}"`;
  return "";
}

export function workLinesOf(options: {
  items: WorkItem[];
  now: number;
}): WorkLine[] {
  return options.items.map((item) => ({
    key: `${item.kind}:${item.id}`,
    text: `${capitalized(item.what)}${subjectOf(item)}`,
    service: item.kind === "review" ? "the critic" : item.server,
    state: item.state,
    seconds: Math.max(
      0,
      Math.round((options.now - Date.parse(item.startedAt)) / 1000),
    ),
  }));
}

export function clockOf(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes)}:${String(rest).padStart(2, "0")}`;
}
