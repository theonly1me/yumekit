export class SceneFailure extends Error {
  readonly sceneId: string;

  constructor(options: { sceneId: string; message: string; cause?: unknown }) {
    super(options.message, { cause: options.cause });
    this.sceneId = options.sceneId;
  }
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
