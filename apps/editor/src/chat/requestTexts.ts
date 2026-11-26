export interface NeighborScene {
  number: number;
  title: string;
}

export const fitTheVoiceRequest =
  "The voice may not match the scenes now. Fit the voice to the scenes.";

export const changeStartsByRowName: Record<string, string> = {
  Voice: "Change the voice to ",
  Music: "Change the music to ",
  Captions: "Change the captions to ",
};

function sceneName(scene: NeighborScene): string {
  return `scene ${String(scene.number)} "${scene.title}"`;
}

export function newSceneRequest(options: {
  description: string;
  before: NeighborScene;
  after: NeighborScene | undefined;
}): string {
  const place =
    options.after === undefined
      ? `after ${sceneName(options.before)}, at the end of the video`
      : `between ${sceneName(options.before)} and ${sceneName(options.after)}`;
  return `Add a new scene ${place}. The new scene: ${options.description}`;
}

export function changeStartOf(rowName: string): string {
  return (
    changeStartsByRowName[rowName] ?? `Change the ${rowName.toLowerCase()} to `
  );
}
