import { prettifyError, type z } from "zod";
import { fail, succeed, type Outcome } from "../outcome.js";

export interface FileSource {
  read: (file: string) => Promise<string | undefined>;
  sceneIds: () => Promise<string[]>;
}

export interface InvalidFile {
  kind: "invalid-file";
  file: string;
  message: string;
}

export async function readTextFile(options: {
  source: FileSource;
  file: string;
}): Promise<Outcome<string, InvalidFile>> {
  const text = await options.source.read(options.file);
  if (text === undefined) {
    return fail({
      kind: "invalid-file",
      file: options.file,
      message: "The file is missing.",
    });
  }
  return succeed(text);
}

export function parseJson(options: {
  text: string;
  file: string;
}): Outcome<unknown, InvalidFile> {
  try {
    const value: unknown = JSON.parse(options.text);
    return succeed(value);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fail({
        kind: "invalid-file",
        file: options.file,
        message: error.message,
      });
    }
    throw error;
  }
}

export async function readJsonFile<Schema extends z.ZodType>(options: {
  source: FileSource;
  file: string;
  schema: Schema;
}): Promise<Outcome<z.output<Schema>, InvalidFile>> {
  const text = await readTextFile(options);
  if (!text.ok) {
    return text;
  }
  const json = parseJson({ text: text.value, file: options.file });
  if (!json.ok) {
    return json;
  }
  const parsed = options.schema.safeParse(json.value);
  if (!parsed.success) {
    return fail({
      kind: "invalid-file",
      file: options.file,
      message: prettifyError(parsed.error),
    });
  }
  return succeed(parsed.data);
}
