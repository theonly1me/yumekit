import {
  assetLabelOf,
  type Asset,
  type ProjectSnapshot,
} from "@yumekit/project";

function sizeText(asset: Asset): string {
  const parts = [
    ...(asset.widthPixels === undefined || asset.heightPixels === undefined
      ? []
      : [`${String(asset.widthPixels)} by ${String(asset.heightPixels)}`]),
    ...(asset.durationFrames === undefined
      ? []
      : [`${String(asset.durationFrames)} frames`]),
    ...(asset.hasWords ? ["with word timings"] : []),
    ...(asset.hasAudio === true ? ["with sound"] : []),
  ];
  return parts.length === 0 ? "" : `, ${parts.join(", ")}`;
}

function sourceText(asset: Asset): string {
  return asset.source.kind === "import"
    ? "a file of the person"
    : `made by ${asset.source.server}${asset.source.model === undefined ? "" : ` ${asset.source.model}`}`;
}

function marksText(asset: Asset): string {
  const marks = asset.marks ?? [];
  if (marks.length === 0) return "";
  const listed = marks.map((mark) => {
    const parts = [
      ...(mark.region === undefined
        ? []
        : [
            `region x ${String(mark.region.x)} y ${String(mark.region.y)} width ${String(mark.region.width)} height ${String(mark.region.height)}`,
          ]),
      ...(mark.seconds === undefined ? [] : [`at ${String(mark.seconds)} s`]),
    ];
    return `"${mark.name}" (${parts.join(", ")})`;
  });
  return `. Marks: ${listed.join("; ")}`;
}

export function assetsText(snapshot: ProjectSnapshot): string {
  if (snapshot.assets.length === 0) return "## Assets\nNone yet.";
  return [
    "## Assets",
    ...snapshot.assets.map(
      (asset) =>
        `- ${asset.id} (${asset.kind}): "${assetLabelOf(asset)}"${sizeText(asset)}, ${sourceText(asset)}${marksText(asset)}`,
    ),
  ].join("\n");
}
