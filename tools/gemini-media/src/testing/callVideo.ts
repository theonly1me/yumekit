import {
  connectGeminiMedia,
  outputDirectory,
  placeholderKey,
} from "./connectGeminiMedia.ts";

export async function callVideo(options: {
  respond: (request: Request) => Promise<Response>;
  arguments: Record<string, unknown>;
  environment?: NodeJS.ProcessEnv;
}) {
  const directory = await outputDirectory();
  const media = await connectGeminiMedia({
    environment: options.environment ?? { GEMINI_API_KEY: placeholderKey },
    respond: options.respond,
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "A lake at dawn",
      duration_seconds: 5,
      output_directory: directory,
      file_stem: "lake",
      ...options.arguments,
    },
  });
  return { ...media, result, outputDirectory: directory };
}

export async function requestBody(
  request: Request | undefined,
): Promise<unknown> {
  if (!request) throw new Error("No request was sent");
  const body: unknown = await request.clone().json();
  return body;
}
