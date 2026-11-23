import type { HarnessFailure, Outcome } from "../results.js";
import type { PlatformFile } from "./platformFiles.js";

export type SharperFile = PlatformFile & { sharperFile: string };

export function sharperFilesOf(options: {
  files: PlatformFile[];
  platformIds: string[] | undefined;
}): Outcome<[SharperFile, ...SharperFile[]], HarnessFailure> {
  const { platformIds } = options;
  const known = options.files.flatMap((file) =>
    file.platformId === undefined ? [] : [file.platformId],
  );
  const unknown = (platformIds ?? []).filter(
    (id) => !known.some((each) => each === id),
  );
  if (unknown.length > 0) {
    return {
      ok: false,
      failure: {
        kind: "platform-not-found",
        message: `The output has no platform ${unknown.join(", ")}.`,
        hint: `Use these platform ids: ${known.length === 0 ? "none, so leave out platform_ids" : known.join(", ")}.`,
      },
    };
  }
  const chosen = options.files
    .filter(
      (file) =>
        platformIds === undefined ||
        platformIds.some((id) => id === file.platformId),
    )
    .map((file) => ({
      ...file,
      sharperFile: file.file.replace(/\.mp4$/, "-sharper.mp4"),
    }));
  const [first, ...others] = chosen;
  if (first === undefined) {
    return {
      ok: false,
      failure: {
        kind: "invalid-value",
        message: "platform_ids is empty.",
        hint: "Name at least one platform, or leave out platform_ids.",
      },
    };
  }
  return { ok: true, value: [first, ...others] };
}
