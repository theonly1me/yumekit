import { homedir } from "node:os";
import { join } from "node:path";

export interface ModelFile {
  name: string;
  bytes: number;
  sha256: string;
}

export interface NaturalModel {
  folderName: string;
  sourceUrl: string;
  files: ModelFile[];
}

const kokoroSourceUrl =
  "https://huggingface.co/csukuangfj/kokoro-int8-multi-lang-v1_0/resolve/57adb37fc0e8d4bd430cfc1b8f8c2294945b9af2";

const kokoroFiles: ModelFile[] = [
  {
    name: "model.int8.onnx",
    bytes: 114_202_993,
    sha256: "75635ea3b85a32d00094dcdd61a258aba87c160f7c264c304a7b3ae9d734195e",
  },
  {
    name: "voices.bin",
    bytes: 28_200_960,
    sha256: "1c5a5b983d3d50d8586d437a51f3faa2da7919ce76a013c081e65671a3447c29",
  },
  {
    name: "lexicon-us-en.txt",
    bytes: 5_956_885,
    sha256: "7daaab53a181be9885b853a8582bf1838186317e5dadacbcef9c426d6fa0da14",
  },
  {
    name: "tokens.txt",
    bytes: 687,
    sha256: "6ebb6bb288f20f3ae8d004d3c2ca27697da27c037d75e81a60e2a6a663f95425",
  },
  {
    name: "LICENSE",
    bytes: 11_358,
    sha256: "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30",
  },
];

export const kokoroModel: NaturalModel = {
  folderName: "kokoro-int8-multi-lang-v1_0",
  sourceUrl: kokoroSourceUrl,
  files: kokoroFiles,
};

export function totalBytesOf(model: NaturalModel): number {
  let total = 0;
  for (const file of model.files) total += file.bytes;
  return total;
}

export function sizeTextOf(model: NaturalModel): string {
  return `${String(Math.round(totalBytesOf(model) / 1_000_000))} MB`;
}

export function modelFolderOf(options: {
  environment: NodeJS.ProcessEnv;
  model: NaturalModel;
}): string {
  const { environment } = options;
  const replaced = environment["YUMEKIT_CONFIG_DIRECTORY"];
  const configurationFolder =
    replaced === undefined || replaced === ""
      ? join(homedir(), ".config", "yumekit")
      : replaced;
  return join(configurationFolder, "voices", options.model.folderName);
}
