import { join } from "node:path";
import {
  inCatalogOrder,
  isPlatformId,
  type PlatformId,
} from "@yumekit/project";
import { z } from "zod";
import { readOptionalFile } from "../agents/agentFiles.js";

const projectFileSchema = z.looseObject({
  name: z.string(),
  outputs: z.array(
    z.looseObject({ platforms: z.array(z.string()).optional() }),
  ),
});

export interface ProjectFacts {
  name: string;
  platforms: PlatformId[];
}

function factsOf(text: string): ProjectFacts | undefined {
  try {
    const parsed = projectFileSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return undefined;
    const platforms = parsed.data.outputs
      .flatMap((output) => output.platforms ?? [])
      .filter(isPlatformId);
    return { name: parsed.data.name, platforms: inCatalogOrder(platforms) };
  } catch {
    return undefined;
  }
}

export async function readProjectFacts(
  folder: string,
): Promise<ProjectFacts | undefined> {
  const read = await readOptionalFile(join(folder, "project.json"));
  if (!read.ok || read.value === undefined) return undefined;
  return factsOf(read.value);
}
