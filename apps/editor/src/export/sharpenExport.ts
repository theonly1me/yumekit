import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import { fileNameOf, type JobState, type MadeFile } from "./exportJobs.js";

export interface SharperRequest {
  outputId: string;
  platformIds: string[] | undefined;
}

const sharperResultSchema = z.object({
  files: z.array(
    z.object({ file: z.string(), platform_id: z.string().optional() }),
  ),
});

const failureSchema = z.object({ message: z.string() });

function failedText(text: string): string {
  return `The sharper copy was not made. The normal file is ready. ${text}`;
}

export async function withSharperCopy(options: {
  client: EngineClient;
  request: SharperRequest;
  files: MadeFile[];
}): Promise<Extract<JobState, { kind: "done" }>> {
  const { request, files } = options;
  const reply = await options.client.callTool({
    name: "make_sharper_copy",
    input: {
      output_id: request.outputId,
      ...(request.platformIds === undefined
        ? {}
        : { platform_ids: request.platformIds }),
    },
    callId: crypto.randomUUID(),
  });
  if (!reply.ok) {
    const message =
      reply.failure.kind === "request-failed"
        ? reply.failure.message
        : "The engine is not reachable.";
    return { kind: "done", files, sharperFailure: failedText(message) };
  }
  if (reply.value.isError) {
    const failure = failureSchema.safeParse(reply.value.data);
    const message = failure.success ? failure.data.message : reply.value.text;
    return { kind: "done", files, sharperFailure: failedText(message) };
  }
  const result = sharperResultSchema.safeParse(reply.value.data);
  if (!result.success) {
    return {
      kind: "done",
      files,
      sharperFailure: failedText(reply.value.text),
    };
  }
  const sharperFiles = result.data.files.map((entry) => ({
    file: entry.file,
    fileName: fileNameOf(entry.file),
    platformId: entry.platform_id,
    isSharper: true,
  }));
  return {
    kind: "done",
    files: [...files, ...sharperFiles],
    sharperFailure: undefined,
  };
}
