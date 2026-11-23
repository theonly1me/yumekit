import type { AskInput } from "../chat/chatRequests.js";
import {
  oneTimeModelSentence,
  type ModelTarget,
} from "../settings/services/index.js";

export type FixedRequest =
  | { kind: "update-the-video" }
  | {
      kind: "change-the-picture";
      words: string;
      aboutClipId: string;
      model?: ModelTarget;
    }
  | { kind: "use-my-own-picture"; fileName: string; aboutClipId: string }
  | { kind: "record-the-changed-lines" }
  | { kind: "another-voice"; voiceName: string; model?: ModelTarget }
  | { kind: "make-this-music"; words: string; model?: ModelTarget }
  | { kind: "add-a-sound"; words: string; model?: ModelTarget }
  | { kind: "match-the-captions" }
  | { kind: "back-to-graphics"; aboutClipId: string }
  | { kind: "make-a-cast-picture"; name: string; description: string }
  | { kind: "use-my-file"; fileName: string }
  | { kind: "continue-after-the-plan" }
  | { kind: "make-the-rest" }
  | { kind: "try-the-step-again"; part: "voice" | "music" }
  | { kind: "record-a-voice-line"; aboutClipId: string }
  | {
      kind: "let-the-ai-make-the-clip";
      aboutClipId: string;
      model?: ModelTarget;
    };

export type AskTheAi = (input: AskInput) => Promise<boolean>;

function castPictureSentenceOf(options: {
  name: string;
  description: string;
}): string {
  const description = options.description.trim();
  const looks = /[.!?]$/.test(description) ? description : `${description}.`;
  const looksSentence =
    description === "" ? "" : ` It looks like this: ${looks}`;
  return `Make a picture of "${options.name}" from the cast.${looksSentence} Add the picture to the pictures of that cast entry.`;
}

function requestSentenceOf(request: FixedRequest): string {
  switch (request.kind) {
    case "update-the-video":
      return "I changed the script. Update the video to match the script.";
    case "change-the-picture":
      return `Change the picture of this scene: ${request.words}`;
    case "use-my-own-picture":
      return `Use my picture ${request.fileName} as the picture of this scene.`;
    case "record-the-changed-lines":
      return "Record the voice again for the lines that I changed in the script.";
    case "another-voice":
      return `Record the voice again with the voice ${request.voiceName}.`;
    case "make-this-music":
      return `Change the music to: ${request.words}`;
    case "add-a-sound":
      return `Add this sound to the video where it fits: ${request.words}`;
    case "match-the-captions":
      return "Make the captions match my recording.";
    case "back-to-graphics":
      return "Draw this scene by code, with no video clip.";
    case "make-a-cast-picture":
      return castPictureSentenceOf(request);
    case "use-my-file":
      return `Use my file ${request.fileName} in the video where it fits best.`;
    case "continue-after-the-plan":
      return "The plan is good. Make the rest of the video.";
    case "make-the-rest":
      return "Make the rest of the video.";
    case "try-the-step-again":
      return request.part === "voice"
        ? "Record the voice of the video again."
        : "Make the music of the video again.";
    case "record-a-voice-line":
      return "Record a voice line for this scene.";
    case "let-the-ai-make-the-clip":
      return "Make a real video clip for this scene. Write the prompt and pick the camera move yourself.";
  }
}

function endedSentence(sentence: string): string {
  const trimmed = sentence.trimEnd();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function fixedRequestTextOf(request: FixedRequest): string {
  const sentence = endedSentence(requestSentenceOf(request));
  const model =
    request.kind === "another-voice" ||
    request.kind === "make-this-music" ||
    request.kind === "add-a-sound" ||
    request.kind === "change-the-picture" ||
    request.kind === "let-the-ai-make-the-clip"
      ? request.model
      : undefined;
  return model === undefined
    ? sentence
    : `${sentence} ${oneTimeModelSentence(model)}`;
}

function aboutClipIdOf(request: FixedRequest): string | undefined {
  return "aboutClipId" in request ? request.aboutClipId : undefined;
}

export function sendFixedRequest(options: {
  ask: AskTheAi;
  request: FixedRequest;
}): Promise<boolean> {
  return options.ask({
    text: fixedRequestTextOf(options.request),
    aboutClipId: aboutClipIdOf(options.request),
  });
}
