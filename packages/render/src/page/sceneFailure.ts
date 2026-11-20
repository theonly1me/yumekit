export class SceneFailure extends Error {
  readonly sceneId: string;

  constructor(options: { sceneId: string; message: string; cause?: unknown }) {
    super(options.message, { cause: options.cause });
    this.sceneId = options.sceneId;
  }
}

export class KitSceneNotFound extends SceneFailure {
  readonly component: string;

  constructor(options: { sceneId: string; component: string }) {
    super({
      sceneId: options.sceneId,
      message: `The kit has no scene component "${options.component}" (scene "${options.sceneId}")`,
    });
    this.component = options.component;
  }
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
