import {
  connectFalMedia,
  placeholderKey,
  temporaryFolder,
} from "./connectFalMedia.ts";
import { fakeFal } from "./fakeFal.ts";

export async function callFalTool(options: {
  name: "generate_image" | "generate_video";
  arguments: (folder: string) => Promise<Record<string, unknown>>;
  respond?: (request: Request) => Promise<Response>;
}) {
  const folder = await temporaryFolder();
  const media = await connectFalMedia({
    environment: { FAL_KEY: placeholderKey },
    respond: options.respond ?? fakeFal({}),
  });
  const result = await media.callTool({
    name: options.name,
    arguments: {
      prompt: "A red fox in snow",
      output_directory: folder,
      file_stem: "fox",
      ...(await options.arguments(folder)),
    },
  });
  const submits = media.requests.filter(
    (request) =>
      new URL(request.url).hostname === "queue.fal.run" &&
      request.method === "POST",
  );
  return { result, media, folder, submits };
}
