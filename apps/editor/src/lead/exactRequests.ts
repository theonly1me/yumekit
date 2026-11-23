export interface ToolStep {
  tool: string;
  input: Record<string, unknown>;
}

export interface ExactRequest {
  kind: "exact";
  sentence: string;
  steps: ToolStep[];
  aboutClipId?: string | undefined;
}

export const exactStepsHeading =
  "Use exactly these tool inputs, in this order:";

export function exactDetailsOf(request: ExactRequest): string {
  return [
    exactStepsHeading,
    ...[...request.steps.entries()].map(
      ([index, step]) =>
        `${String(index + 1)}. ${step.tool} ${JSON.stringify(step.input)}`,
    ),
  ].join("\n");
}

function secondsText(seconds: number | undefined): string {
  return seconds === undefined
    ? ""
    : `, ${String(seconds)} ${seconds === 1 ? "second" : "seconds"} long`;
}

export function videoClipRequest(options: {
  modelLabel: string;
  seconds: number | undefined;
  cameraMoveLabel: string | undefined;
  startPicture: string | undefined;
  endPicture: string | undefined;
  steps: ToolStep[];
  aboutClipId: string;
}): ExactRequest {
  const move =
    options.cameraMoveLabel === undefined
      ? ""
      : `, with the camera move ${options.cameraMoveLabel}`;
  const start =
    options.startPicture === undefined ? "" : `, from ${options.startPicture}`;
  const end =
    options.endPicture === undefined ? "" : `, to ${options.endPicture}`;
  return {
    kind: "exact",
    sentence: `Make a real video clip for this scene with ${options.modelLabel}${secondsText(options.seconds)}${move}${start}${end}. Put it in place of the scene.`,
    steps: options.steps,
    aboutClipId: options.aboutClipId,
  };
}

export function stillRequest(options: {
  modelLabel: string;
  prompt: string;
  steps: ToolStep[];
  aboutClipId: string | undefined;
}): ExactRequest {
  return {
    kind: "exact",
    sentence: `Make a still picture with ${options.modelLabel} as the first picture of the clip: ${options.prompt}`,
    steps: options.steps,
    aboutClipId: options.aboutClipId,
  };
}

export function talkingClipRequest(options: {
  speakerName: string;
  modelLabel: string;
  steps: ToolStep[];
  aboutClipId: string;
}): ExactRequest {
  return {
    kind: "exact",
    sentence: `Make a talking clip of ${options.speakerName} for this scene with ${options.modelLabel}, with the voice line of this scene. Put it in place of the scene.`,
    steps: options.steps,
    aboutClipId: options.aboutClipId,
  };
}

export function musicStyleRequest(options: {
  styleLabel: string;
  seed: number;
  steps: ToolStep[];
}): ExactRequest {
  return {
    kind: "exact",
    sentence: `Use the music "${options.styleLabel}" from this computer, take ${String(options.seed)}, for the whole video.`,
    steps: options.steps,
  };
}

export function sharperCopyRequest(options: {
  versionName: string;
  steps: ToolStep[];
}): ExactRequest {
  return {
    kind: "exact",
    sentence: `Make a sharper copy of ${options.versionName}.`,
    steps: options.steps,
  };
}
