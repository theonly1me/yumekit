import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";
import { describeToolName } from "./convention.js";
import {
  mediaServerDescriptionSchema,
  type MediaServerDescription,
} from "./description.js";
import { errorMessage } from "./errorMessage.js";

export interface DescriptionRead {
  description?: MediaServerDescription;
  descriptionFailure?: { kind: "media-tool-invalid-result"; message: string };
}

function invalid(message: string): DescriptionRead {
  return { descriptionFailure: { kind: "media-tool-invalid-result", message } };
}

export async function describeServer(client: Client): Promise<DescriptionRead> {
  let result: Awaited<ReturnType<Client["callTool"]>>;
  try {
    result = await client.callTool({ name: describeToolName, arguments: {} });
  } catch (error) {
    return invalid(errorMessage(error));
  }
  if (result.isError === true) {
    return invalid(`${describeToolName} returned a failure`);
  }
  const parsed = mediaServerDescriptionSchema.safeParse(
    result.structuredContent,
  );
  if (!parsed.success) return invalid(z.prettifyError(parsed.error));
  return { description: parsed.data };
}
