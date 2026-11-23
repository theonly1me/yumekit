export interface LabeledAsset {
  kind: "image" | "audio" | "video" | "font";
  label?: string | undefined;
  source:
    | { kind: "import"; originalName: string }
    | { kind: "tool"; input: Readonly<Record<string, unknown>> };
}

const labelWordLimit = 6;
const labelLengthLimit = 60;

const kindLabels: Record<LabeledAsset["kind"], string> = {
  image: "Picture",
  audio: "Sound",
  video: "Video clip",
  font: "Font",
};

export function labelOfWords(text: string): string | undefined {
  const [firstLine = ""] = text.trim().split("\n");
  const words = firstLine.split(/\s+/).filter((word) => word !== "");
  const shortened = words
    .slice(0, labelWordLimit)
    .join(" ")
    .slice(0, labelLengthLimit)
    .replace(/[\s.,;:!?-]+$/, "");
  if (shortened === "") return undefined;
  const ending = words.length > labelWordLimit ? "..." : "";
  return `${shortened.charAt(0).toUpperCase()}${shortened.slice(1)}${ending}`;
}

function wordsOfInput(input: Readonly<Record<string, unknown>>) {
  const words = input["prompt"] ?? input["text"];
  return typeof words === "string" ? labelOfWords(words) : undefined;
}

export function assetLabelOf(asset: LabeledAsset): string {
  if (asset.label !== undefined && asset.label.trim() !== "") {
    return asset.label;
  }
  if (asset.source.kind === "import") return asset.source.originalName;
  return wordsOfInput(asset.source.input) ?? kindLabels[asset.kind];
}
