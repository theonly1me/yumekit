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
  | { kind: "match-the-captions" }
  | { kind: "back-to-graphics"; aboutClipId: string }
  | { kind: "use-my-file"; fileName: string }
  | { kind: "continue-after-the-plan" };

export type AskTheAi = (input: AskInput) => Promise<boolean>;

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
    case "match-the-captions":
      return "Make the captions match my recording.";
    case "back-to-graphics":
      return "Draw this scene by code, with no video clip.";
    case "use-my-file":
      return `Use my file ${request.fileName} in the video where it fits best.`;
    case "continue-after-the-plan":
      return "The plan is good. Make the rest of the video.";
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
    request.kind === "change-the-picture"
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
