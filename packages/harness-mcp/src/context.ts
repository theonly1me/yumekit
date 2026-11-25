import type { ProjectStore } from "@yumekit/project";
import type { PictureRenderer } from "@yumekit/render";
import type { MediaTools } from "@yumekit/tools";
import type { ToolTable } from "./harness/toolTable.js";
import type { FilmClock } from "./clock/filmClock.js";
import type { WorkBoard } from "./work/board/workBoard.js";

export type LatestWrites = <Value>(
  write: () => Promise<Value>,
) => Promise<Value>;

export interface HarnessContext {
  tools: ToolTable;
  store: ProjectStore;
  mediaTools: MediaTools;
  pictures: PictureRenderer;
  board: WorkBoard;
  writeLatest: LatestWrites;
  clock: FilmClock;
}
