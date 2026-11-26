export type ChapterFailureKind =
  "chapter-misses-shot" | "shot-in-two-chapters" | "chapters-break-order";

export interface RuleFailure {
  kind:
    | "id-in-use"
    | "not-found"
    | "clips-overlap"
    | "invalid-value"
    | ChapterFailureKind;
  message: string;
  file: string;
}

export function timelineFile(outputId: string): string {
  return `timelines/${outputId}.json`;
}

export function sceneCodeFile(sceneId: string): string {
  return `scenes/${sceneId}/scene.tsx`;
}
