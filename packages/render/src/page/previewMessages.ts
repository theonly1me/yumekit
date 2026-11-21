export interface SeekRequest {
  type: "seek";
  frame: number;
  requestId: number;
}

export type PreviewReply =
  | { type: "ready"; frameCount: number }
  | { type: "sought"; requestId: number }
  | {
      type: "failed";
      requestId: number;
      kind: string;
      message: string;
      sceneId?: string;
    };

export function seekRequestOf(data: unknown): SeekRequest | undefined {
  if (
    typeof data !== "object" ||
    data === null ||
    !("type" in data) ||
    data.type !== "seek" ||
    !("frame" in data) ||
    !("requestId" in data)
  ) {
    return undefined;
  }
  const { frame, requestId } = data;
  return typeof frame === "number" && typeof requestId === "number"
    ? { type: "seek", frame, requestId }
    : undefined;
}

export function permittedOriginOf(value: string | null): string | undefined {
  if (value === null || !URL.canParse(value)) {
    return undefined;
  }
  const { origin } = new URL(value);
  return origin === value && origin !== "null" ? origin : undefined;
}
