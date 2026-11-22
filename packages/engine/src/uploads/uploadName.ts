const idLengthLimit = 64;
const nameLengthLimit = 200;

function lastPartOf(name: string | null): string {
  return (name ?? "").split(/[/\\]/).at(-1) ?? "";
}

export function shownUploadNameOf(name: string | null): string {
  return lastPartOf(name)
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(-nameLengthLimit);
}

export function safeUploadNameOf(name: string | null): string | undefined {
  const lastPart = lastPartOf(name);
  const kept = lastPart
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(-nameLengthLimit);
  return kept === "" ? undefined : kept;
}

export function uploadAssetIdOf(options: {
  fileName: string;
  takenIds: string[];
}): string {
  const stem = options.fileName.replace(/\.[^.]*$/, "");
  const base =
    stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .slice(0, idLengthLimit)
      .replace(/-+$/, "") || "file";
  if (!options.takenIds.includes(base)) return base;
  for (let copyNumber = 2; ; copyNumber += 1) {
    const suffix = `-${String(copyNumber)}`;
    const candidate = `${base.slice(0, idLengthLimit - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!options.takenIds.includes(candidate)) return candidate;
  }
}
