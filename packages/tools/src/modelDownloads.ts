import type { StartedServer } from "./connectServer.js";
import { errorMessage } from "./errorMessage.js";
import { textOfContent } from "./runTool.js";
import { isStarted } from "./selectServer.js";
import type { ServerPool } from "./serverPool.js";
import type { MediaToolFailure, MediaToolProgress, Outcome } from "./types.js";

export const prepareToolName = "prepare_model";

export type PrepareFailure =
  | Extract<
      MediaToolFailure,
      {
        kind:
          "server-not-found" | "media-tool-failed" | "server-failed-to-start";
      }
    >
  | { kind: "nothing-to-prepare"; server: string };

export function waitsForDownload(connection: StartedServer): boolean {
  return (connection.description?.models ?? []).some(
    (model) => model.download?.ready === false,
  );
}

export async function prepareModel(options: {
  pool: ServerPool;
  server: string;
  model: string | undefined;
  onProgress: ((progress: MediaToolProgress) => void) | undefined;
  toolTimeoutSeconds: number;
}): Promise<Outcome<true, PrepareFailure>> {
  const { server, onProgress } = options;
  const found = options.pool
    .connections()
    .filter(isStarted)
    .find((connection) => connection.name === server);
  if (found === undefined) {
    return { ok: false, failure: { kind: "server-not-found", server } };
  }
  if (!found.toolNames.includes(prepareToolName)) {
    return { ok: false, failure: { kind: "nothing-to-prepare", server } };
  }
  const refreshed = await options.pool.refresh(found);
  if (!refreshed.ok) return refreshed;
  const connection = refreshed.value;
  try {
    const result = await connection.client.callTool(
      {
        name: prepareToolName,
        arguments: options.model === undefined ? {} : { model: options.model },
      },
      undefined,
      {
        timeout: options.toolTimeoutSeconds * 1000,
        ...(onProgress === undefined
          ? {}
          : {
              onprogress: ({ progress, total, message }) => {
                onProgress({
                  done: progress,
                  ...(total === undefined ? {} : { total }),
                  ...(message === undefined ? {} : { message }),
                });
              },
            }),
      },
    );
    await options.pool.redescribe(connection);
    if (result.isError === true) {
      return {
        ok: false,
        failure: {
          kind: "media-tool-failed",
          server,
          message: textOfContent(result.content),
        },
      };
    }
    return { ok: true, value: true };
  } catch (error) {
    return {
      ok: false,
      failure: {
        kind: "media-tool-failed",
        server,
        message: errorMessage(error),
      },
    };
  }
}
