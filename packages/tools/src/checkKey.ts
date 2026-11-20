import { z } from "zod";
import { checkKeyToolName } from "./convention.js";
import type { StartedServer } from "./connectServer.js";
import { errorMessage } from "./errorMessage.js";
import { isTimeout, textOfContent } from "./runTool.js";
import type { CheckKeyFailure, KeyCheck, Outcome } from "./types.js";

const keyCheckSchema = z.object({ valid: z.boolean(), message: z.string() });

export async function callCheckKey(options: {
  connection: StartedServer;
  toolTimeoutSeconds: number;
}): Promise<Outcome<KeyCheck, CheckKeyFailure>> {
  const { connection, toolTimeoutSeconds } = options;
  const server = connection.name;
  if (!connection.toolNames.includes(checkKeyToolName)) {
    return { ok: false, failure: { kind: "no-check-key-tool", server } };
  }
  let result: Awaited<ReturnType<StartedServer["client"]["callTool"]>>;
  try {
    result = await connection.client.callTool(
      { name: checkKeyToolName, arguments: {} },
      undefined,
      { timeout: toolTimeoutSeconds * 1000 },
    );
  } catch (error) {
    return {
      ok: false,
      failure: isTimeout(error)
        ? {
            kind: "media-tool-timeout",
            server,
            timeoutSeconds: toolTimeoutSeconds,
          }
        : { kind: "media-tool-failed", server, message: errorMessage(error) },
    };
  }
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
  const parsed = keyCheckSchema.safeParse(result.structuredContent);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        kind: "media-tool-invalid-result",
        server,
        message: z.prettifyError(parsed.error),
      },
    };
  }
  return { ok: true, value: parsed.data };
}
