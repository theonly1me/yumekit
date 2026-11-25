import type { OpenFailure } from "@yumekit/project";

export type RenderScale = 0.25 | 0.5 | 1;

export type RenderFailure = { message: string; hint?: string } & (
  | { kind: "project-invalid"; openFailure: OpenFailure }
  | { kind: "output-not-found"; outputId: string }
  | { kind: "frame-out-of-range"; frame: number; frameCount: number }
  | { kind: "browser-not-installed" }
  | { kind: "ffmpeg-not-found" }
  | { kind: "scene-import-not-permitted"; sceneId: string; importName: string }
  | {
      kind: "scene-compile-failed";
      sceneId: string;
      line: number;
      column: number;
    }
  | { kind: "kit-scene-not-found"; sceneId: string; component: string }
  | { kind: "scene-not-found"; sceneId: string }
  | { kind: "scene-error"; sceneId: string; frame: number }
  | { kind: "scene-not-repeatable"; sceneIds: string[]; frame: number }
  | { kind: "media-not-readable"; file: string }
  | { kind: "encode-failed"; stderrTail: string }
  | {
      kind: "file-size-not-reached";
      largestMegabytes: number;
      smallestMegabytes: number;
    }
  | { kind: "video-frames-failed"; assetId: string; stderrTail: string }
);
