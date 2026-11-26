import type { EngineClient } from "../engine/engineClient.js";
import { askLead } from "../lead/askLead.js";
import { sharperCopyRequest } from "../lead/exactRequests.js";
import { answerLineOf, stepDone } from "../lead/useLeadRequest.js";
import { fileNameOf, type JobState, type MadeFile } from "./exportJobs.js";

export interface SharperRequest {
  outputId: string;
  platformIds: string[] | undefined;
  versionName: string;
  server: string;
  model?: string;
}

function failedText(text: string): string {
  return `The sharper copy was not made. The normal file is ready. ${text}`;
}

function sharperFileOf(file: string): string {
  return file.replace(/\.mp4$/, "-sharper.mp4");
}

export async function withSharperCopy(options: {
  client: EngineClient;
  request: SharperRequest;
  files: MadeFile[];
}): Promise<Extract<JobState, { kind: "done" }>> {
  const { request, files } = options;
  const answered = await askLead({
    client: options.client,
    request: sharperCopyRequest({
      versionName: request.versionName,
      steps: [
        {
          tool: "make_sharper_copy",
          input: {
            output_id: request.outputId,
            server: request.server,
            ...(request.model === undefined ? {} : { model: request.model }),
            ...(request.platformIds === undefined
              ? {}
              : { platform_ids: request.platformIds }),
          },
        },
      ],
    }),
  });
  if (answered.kind === "not-sent") {
    return {
      kind: "done",
      files,
      sharperFailure: failedText(answered.message),
    };
  }
  const { answer } = answered;
  if (
    answer.state !== "done" ||
    !stepDone({ answer, tool: "make_sharper_copy" })
  ) {
    return {
      kind: "done",
      files,
      sharperFailure: failedText(answerLineOf(answer)),
    };
  }
  const sharperFiles = files
    .filter(
      (made) =>
        request.platformIds === undefined ||
        made.platformId === undefined ||
        request.platformIds.includes(made.platformId),
    )
    .map((made): MadeFile => {
      const file = sharperFileOf(made.renderPath);
      const fileName = fileNameOf(file);
      return {
        file,
        fileName,
        renderPath: file,
        served: { folder: "renders", fileName },
        platformId: made.platformId,
        isSharper: true,
      };
    });
  return {
    kind: "done",
    files: [...files, ...sharperFiles],
    sharperFailure: undefined,
  };
}
