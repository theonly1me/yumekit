import { cameraMoveCatalog } from "@yumekit/project";

export const cameraMovesSection = [
  "## Camera moves of a video clip",
  "",
  "A scene that shows a generated video clip gets its camera from the video model. Give generate_asset with the capability video one camera_move. The harness adds a tested sentence for the move to the end of the prompt, so the prompt describes the subject, the action, the place, and the light, not the camera. Pick one move for each clip. Leave camera_move out for a clip where the camera does not matter.",
  "",
  ...cameraMoveCatalog.map((move) => `- \`${move.id}\`: ${move.line}`),
  "",
].join("\n");
