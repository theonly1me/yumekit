import { basename, resolve } from "node:path";
import { createProject, type Output, type Project } from "@yumekit/project";
import { failed, usageError, type CommandResult } from "../commandResult.js";
import {
  parseCommandLine,
  stringListOption,
  stringOption,
  type Parsed,
} from "../options.js";

const frameRates = [24, 25, 30, 50, 60] as const;

const defaultOutput: Output = {
  id: "wide",
  label: "wide",
  widthPixels: 1920,
  heightPixels: 1080,
};

function frameRateOf(
  text: string | undefined,
): Parsed<Project["framesPerSecond"]> {
  if (text === undefined) return { ok: true, value: 30 };
  const frameRate = frameRates.find((candidate) => String(candidate) === text);
  return frameRate === undefined
    ? {
        ok: false,
        message: `--frame-rate must be one of ${frameRates.join(", ")}, not "${text}".`,
      }
    : { ok: true, value: frameRate };
}

function outputOf(text: string): Parsed<Output> {
  const match = /^([a-z0-9][a-z0-9-]{0,63}):(\d+)x(\d+)$/.exec(text);
  const [, id, width, height] = match ?? [];
  if (id === undefined || width === undefined || height === undefined) {
    return {
      ok: false,
      message: `--output must look like wide:1920x1080 (id:WIDTHxHEIGHT), not "${text}".`,
    };
  }
  return {
    ok: true,
    value: {
      id,
      label: id,
      widthPixels: Number(width),
      heightPixels: Number(height),
    },
  };
}

function mcpCommandText(folder: string): string {
  const mainFile = process.argv[1] ?? "yumekit";
  return `${process.execPath} ${mainFile} mcp --project ${folder}`;
}

export async function initCommand(args: string[]): Promise<CommandResult> {
  const parsed = parseCommandLine({
    args,
    config: {
      name: { type: "string" },
      "frame-rate": { type: "string" },
      output: { type: "string", multiple: true },
    },
  });
  if (!parsed.ok) return usageError(parsed.message);
  const { values, positionals } = parsed.value;
  const [folderArgument, ...extra] = positionals;
  if (folderArgument === undefined || extra.length > 0) {
    return usageError("init needs exactly one folder.");
  }
  const folder = resolve(folderArgument);
  const frameRate = frameRateOf(stringOption({ values, name: "frame-rate" }));
  if (!frameRate.ok) return usageError(frameRate.message);
  const outputs: Output[] = [];
  for (const text of stringListOption({ values, name: "output" })) {
    const output = outputOf(text);
    if (!output.ok) return usageError(output.message);
    outputs.push(output.value);
  }
  const name = stringOption({ values, name: "name" }) ?? basename(folder);
  const created = await createProject({
    folder,
    name,
    framesPerSecond: frameRate.value,
    outputs: outputs.length === 0 ? [defaultOutput] : outputs,
  });
  if (!created.ok) return failed(created.failure.message);
  return {
    kind: "done",
    output: [
      `Created the project "${name}" in ${folder}.`,
      "Serve it to an agent with:",
      `  ${mcpCommandText(folder)}`,
      "",
    ].join("\n"),
  };
}
