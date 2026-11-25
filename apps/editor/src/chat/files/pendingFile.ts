export type FileKind =
  "picture" | "video" | "sound" | "font" | "text" | "other";

export type PendingState =
  | { kind: "waiting" }
  | { kind: "adding" }
  | { kind: "added"; assetId: string }
  | { kind: "failed"; message: string; canRetry: boolean };

export interface PendingFile {
  id: string;
  file: File;
  kind: FileKind;
  previewUrl: string | undefined;
  state: PendingState;
}

export interface SentFileInput {
  assetId: string;
  name: string;
}

export const acceptedFiles =
  "image/*,video/*,audio/*,.txt,.md,.woff2,.woff,.ttf,.otf";

export const thumbLabels: Record<FileKind, string> = {
  picture: "Picture",
  video: "Video",
  sound: "Sound",
  font: "Font",
  text: "Text",
  other: "File",
};

export const notReadable =
  "yumekit cannot read this kind of file. Add a picture, a video, a sound, a font, or a text file.";

const extensionKinds: [string[], FileKind][] = [
  [[".woff2", ".woff", ".ttf", ".otf"], "font"],
  [[".txt", ".md"], "text"],
  [[".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"], "picture"],
  [[".mp4", ".mov", ".webm", ".m4v"], "video"],
  [[".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"], "sound"],
];

const typeKinds: [string, FileKind][] = [
  ["image/", "picture"],
  ["video/", "video"],
  ["audio/", "sound"],
  ["text/plain", "text"],
  ["text/markdown", "text"],
];

export function fileKindOf(file: { name: string; type: string }): FileKind {
  const name = file.name.toLowerCase();
  const byExtension = extensionKinds.find(([extensions]) =>
    extensions.some((extension) => name.endsWith(extension)),
  );
  if (byExtension !== undefined) return byExtension[1];
  const byType = typeKinds.find(([prefix]) => file.type.startsWith(prefix));
  return byType === undefined ? "other" : byType[1];
}
