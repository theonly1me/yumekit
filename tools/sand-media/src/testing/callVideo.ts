import { join } from "node:path";
import {
  connectSandMedia,
  placeholderKey,
  temporaryFolder,
} from "./connectSandMedia.ts";

export async function callVideo(options: {
  respond: (request: Request) => Promise<Response>;
  arguments?: (folder: string) => Promise<Record<string, unknown>>;
  environment?: NodeJS.ProcessEnv;
}) {
  const folder = await temporaryFolder();
  const outputDirectory = join(folder, "assets");
  const media = await connectSandMedia({
    environment: options.environment ?? { SAND_API_KEY: placeholderKey },
    respond: options.respond,
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "Waves break against the rocks at dawn",
      duration_seconds: 5,
      output_directory: outputDirectory,
      file_stem: "waves",
      ...(await options.arguments?.(folder)),
    },
  });
  const creates = media.requests.filter((request) => request.method === "POST");
  return { ...media, result, folder, outputDirectory, creates };
}
