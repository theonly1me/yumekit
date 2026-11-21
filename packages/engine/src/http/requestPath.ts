import type { Outcome } from "../engineTypes.js";
import type { Rejection } from "./requestChecks.js";

export interface RequestPath {
  segments: string[];
  query: URLSearchParams;
}

const pathNotValid: Rejection = {
  status: 400,
  kind: "path-not-valid",
  message: "The request path is not valid.",
};

function decodedSegmentOf(segment: string): string | undefined {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
}

function isSafeSegment(segment: string): boolean {
  return (
    segment !== "." &&
    segment !== ".." &&
    !segment.includes("/") &&
    !segment.includes("\\") &&
    !segment.includes("\0")
  );
}

export function requestPathOf(
  rawUrl: string | undefined,
): Outcome<RequestPath, Rejection> {
  const url = rawUrl ?? "";
  const queryStart = url.indexOf("?");
  const path = queryStart === -1 ? url : url.slice(0, queryStart);
  const queryText = queryStart === -1 ? "" : url.slice(queryStart + 1);
  if (!path.startsWith("/")) return { ok: false, failure: pathNotValid };
  const segments: string[] = [];
  for (const rawSegment of path.slice(1).split("/")) {
    const segment = decodedSegmentOf(rawSegment);
    if (segment === undefined || !isSafeSegment(segment)) {
      return { ok: false, failure: pathNotValid };
    }
    segments.push(segment);
  }
  return {
    ok: true,
    value: { segments, query: new URLSearchParams(queryText) },
  };
}
