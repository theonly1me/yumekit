export interface RuleFailure {
  kind: "id-in-use" | "not-found" | "clips-overlap" | "invalid-value";
  message: string;
  file: string;
}

export function timelineFile(outputId: string): string {
  return `timelines/${outputId}.json`;
}

export function sceneCodeFile(sceneId: string): string {
  return `scenes/${sceneId}/scene.tsx`;
}
