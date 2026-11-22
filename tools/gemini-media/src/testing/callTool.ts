import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  connectGeminiMedia,
  outputDirectory,
  placeholderKey,
  temporaryFolder,
} from "./connectGeminiMedia.ts";

export async function callTool(options: {
  name: string;
  arguments: Record<string, unknown>;
  respond: () => Response;
}) {
  const directory = await outputDirectory();
  const media = await connectGeminiMedia({
    environment: { GEMINI_API_KEY: placeholderKey },
    respond: () => Promise.resolve(options.respond()),
  });
  const result = await media.callTool({
    name: options.name,
    arguments: {
      output_directory: directory,
      file_stem: "made",
      ...options.arguments,
    },
  });
  const bodies: unknown[] = [];
  for (const request of media.requests) {
    bodies.push(await request.clone().json());
  }
  return { result, bodies, requests: media.requests };
}

export async function pictureFiles(count: number) {
  const folder = await temporaryFolder();
  const paths: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const path = join(folder, `picture-${String(index)}.png`);
    await writeFile(path, `picture ${String(index)}`);
    paths.push(path);
  }
  return paths;
}

export function base64Of(text: string): string {
  return Buffer.from(text).toString("base64");
}
