export const cameraMoveIds = [
  "static",
  "push-in",
  "pull-out",
  "pan-left",
  "pan-right",
  "tilt-up",
  "tilt-down",
  "orbit",
  "crane-up",
  "drone-rise",
  "tracking",
  "handheld",
  "crash-zoom",
  "dolly-zoom",
  "top-down",
  "low-angle",
] as const;

export type CameraMoveId = (typeof cameraMoveIds)[number];

export interface CameraMove {
  id: CameraMoveId;
  name: string;
  line: string;
  sentence: string;
}

const cameraMovesById: Record<CameraMoveId, Omit<CameraMove, "id">> = {
  static: {
    name: "Locked camera",
    line: "The camera stays still. Only the subject moves.",
    sentence:
      "The camera stays locked off and motionless, with the subject centered and all movement coming from the subject.",
  },
  "push-in": {
    name: "Push in",
    line: "The camera moves slowly toward the subject.",
    sentence:
      "The camera pushes in slowly toward the subject, which stays centered in frame.",
  },
  "pull-out": {
    name: "Pull out",
    line: "The camera moves slowly back and shows more of the place.",
    sentence:
      "The camera pulls back slowly from the subject, which stays centered as more of the scene comes into view.",
  },
  "pan-left": {
    name: "Pan left",
    line: "The camera turns slowly to the left.",
    sentence:
      "The camera pans left slowly and steadily from a fixed position, keeping the subject in frame.",
  },
  "pan-right": {
    name: "Pan right",
    line: "The camera turns slowly to the right.",
    sentence:
      "The camera pans right slowly and steadily from a fixed position, keeping the subject in frame.",
  },
  "tilt-up": {
    name: "Tilt up",
    line: "The camera turns slowly upward.",
    sentence:
      "The camera tilts up slowly and steadily from a fixed position, ending with the subject centered in frame.",
  },
  "tilt-down": {
    name: "Tilt down",
    line: "The camera turns slowly downward.",
    sentence:
      "The camera tilts down slowly and steadily from a fixed position, ending with the subject centered in frame.",
  },
  orbit: {
    name: "Orbit",
    line: "The camera circles slowly around the subject.",
    sentence:
      "The camera orbits slowly around the subject in a smooth arc, keeping the subject centered in frame.",
  },
  "crane-up": {
    name: "Crane up",
    line: "The camera rises slowly above the subject.",
    sentence:
      "The camera cranes up slowly and smoothly above the subject, which stays in frame as the scene widens below.",
  },
  "drone-rise": {
    name: "Drone rise",
    line: "The camera flies up high and shows the wide place around.",
    sentence:
      "An aerial drone shot rises slowly and steadily above the subject, revealing the wide landscape around it.",
  },
  tracking: {
    name: "Follow",
    line: "The camera moves along with the subject.",
    sentence:
      "The camera tracks alongside the moving subject at the same speed, keeping the subject centered in a steady medium shot.",
  },
  handheld: {
    name: "Handheld",
    line: "The camera shakes a little, as if a person holds it.",
    sentence:
      "A handheld camera follows the subject with a subtle, natural shake, keeping the subject loosely centered in frame.",
  },
  "crash-zoom": {
    name: "Crash zoom",
    line: "The camera zooms in very fast on the subject.",
    sentence:
      "The camera does a fast crash zoom in on the subject, which ends filling the frame.",
  },
  "dolly-zoom": {
    name: "Dolly zoom",
    line: "The subject stays the same size while the background stretches.",
    sentence:
      "The camera dollies in slowly while zooming out, so the subject stays the same size as the background stretches behind it.",
  },
  "top-down": {
    name: "Top down",
    line: "The camera looks straight down from above.",
    sentence:
      "A steady bird's-eye shot looks straight down from high above, with the subject centered in frame.",
  },
  "low-angle": {
    name: "Low angle",
    line: "The camera looks up at the subject from below.",
    sentence:
      "A steady low-angle shot looks up at the subject from below, keeping the subject centered and large in frame.",
  },
};

export const cameraMoveCatalog: CameraMove[] = cameraMoveIds.map((id) => ({
  id,
  ...cameraMovesById[id],
}));

export function isCameraMoveId(value: string): value is CameraMoveId {
  return cameraMoveIds.some((id) => id === value);
}

export function findCameraMove(id: string): CameraMove | undefined {
  return isCameraMoveId(id) ? { id, ...cameraMovesById[id] } : undefined;
}
