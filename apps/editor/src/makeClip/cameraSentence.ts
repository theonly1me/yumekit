import { findCameraMove } from "@yumekit/project/camera-moves";

const separator = "\n\n";

function endingOf(cameraMoveId: string | undefined): string | undefined {
  if (cameraMoveId === undefined) return undefined;
  const move = findCameraMove(cameraMoveId);
  return move === undefined ? undefined : `${separator}${move.sentence}`;
}

export function promptWithCameraMove(options: {
  prompt: string;
  cameraMoveId: string | undefined;
}): string {
  const ending = endingOf(options.cameraMoveId);
  return ending === undefined ? options.prompt : `${options.prompt}${ending}`;
}

export function promptWithoutCameraMove(options: {
  prompt: string;
  cameraMoveId: unknown;
}): string {
  const { prompt, cameraMoveId } = options;
  const ending =
    typeof cameraMoveId === "string" ? endingOf(cameraMoveId) : undefined;
  return ending !== undefined && prompt.endsWith(ending)
    ? prompt.slice(0, -ending.length)
    : prompt;
}
