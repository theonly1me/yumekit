export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

export interface SceneOutput {
  id: string;
  widthPixels: number;
  heightPixels: number;
}

export interface SceneWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SceneAsset {
  url: string;
  kind: "image" | "audio" | "video" | "font";
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
  words?: SceneWord[];
}

export interface MountOptions {
  element: HTMLElement;
  output: SceneOutput;
  framesPerSecond: number;
  durationFrames: number;
  props: JsonObject;
  findAsset: (assetId: string) => SceneAsset | undefined;
}

export interface MountedScene {
  seek: (frame: number) => Promise<void>;
  dispose: () => void;
}

export interface SceneModule {
  mount: (options: MountOptions) => Promise<MountedScene>;
}
