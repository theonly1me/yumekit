import type { CurrentPick, MediaKind } from "./mediaChoices.js";

const sampleServer = "sample";

const testWords: Record<MediaKind, string> = {
  image: "test pictures",
  speech: "a test tone, not a voice",
  music: "a test tone, not music",
  video: "test clips",
  "sound-effect": "a test tone, not a real sound",
  "talking-clip": "your picture with the voice, with no moving lips",
  sharper: "a plain larger copy with no new detail",
};

export function currentNoteOf(options: {
  current: CurrentPick;
  kind: MediaKind;
}): string | undefined {
  const { current, kind } = options;
  if (current.state === "not-available") {
    return "This service is not set up now. Pick another one.";
  }
  if (current.state === "needs-key") return "This service needs a key.";
  if (current.server === sampleServer) {
    return `The free test service makes ${testWords[kind]}. Pick another service for a real video.`;
  }
  return current.source === "first-ready"
    ? "yumekit uses the first service that is ready."
    : undefined;
}
