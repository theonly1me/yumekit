import { join } from "node:path";
import { z } from "zod";
import type { Outcome } from "../engineTypes.js";
import { isOnPath, readOptionalFile, writeFileAtomic } from "./agentFiles.js";
import { agentCatalog, type AgentSpecification } from "./agentCatalog.js";
import {
  agentIds,
  type AgentId,
  type AgentRecord,
  type ConnectFailure,
  type ServerCommand,
} from "./agentTypes.js";

const entrySchema = z.looseObject({ args: z.array(z.string()) });

function configurationFileOf(options: {
  agent: AgentSpecification;
  projectFolder: string;
}): string {
  return join(options.projectFolder, ...options.agent.configurationPath);
}

function isEntryForFolder(options: {
  entry: unknown;
  projectFolder: string;
}): boolean {
  const parsed = entrySchema.safeParse(options.entry);
  if (!parsed.success) return false;
  const { args } = parsed.data;
  return [...args.entries()].some(
    ([index, argument]) =>
      argument === "--project" && args[index + 1] === options.projectFolder,
  );
}

async function recordOf(options: {
  agent: AgentSpecification;
  projectFolder: string;
}): Promise<AgentRecord> {
  const { agent, projectFolder } = options;
  const file = configurationFileOf(options);
  const text = await readOptionalFile(file);
  const entry =
    text.ok && text.value !== undefined
      ? agent.format.entryOf(text.value)
      : undefined;
  return {
    id: agent.id,
    name: agent.name,
    installed: await isOnPath(agent.program),
    configured:
      entry !== undefined &&
      entry.ok &&
      isEntryForFolder({ entry: entry.value, projectFolder }),
    start_command: agent.program,
    configuration_file: file,
  };
}

export function listAgents(options: {
  projectFolder: string;
}): Promise<AgentRecord[]> {
  return Promise.all(
    agentIds.map((agentId) =>
      recordOf({
        agent: agentCatalog[agentId],
        projectFolder: options.projectFolder,
      }),
    ),
  );
}

export async function connectAgent(options: {
  agentId: AgentId;
  projectFolder: string;
  serverCommand: ServerCommand;
}): Promise<Outcome<AgentRecord, ConnectFailure>> {
  const agent = agentCatalog[options.agentId];
  const file = configurationFileOf({
    agent,
    projectFolder: options.projectFolder,
  });
  const text = await readOptionalFile(file);
  if (!text.ok) {
    return {
      ok: false,
      failure: {
        kind: "configuration-not-readable",
        file,
        message: `yumekit cannot read ${file}: ${text.failure}`,
      },
    };
  }
  const next = agent.format.withEntry({
    text: text.value,
    serverCommand: options.serverCommand,
  });
  if (!next.ok) {
    return {
      ok: false,
      failure: {
        kind: "configuration-not-valid",
        file,
        message: `yumekit changed nothing in ${file}. ${next.failure}`,
      },
    };
  }
  if (next.value !== text.value) {
    const written = await writeFileAtomic({ file, content: next.value });
    if (!written.ok) {
      return {
        ok: false,
        failure: {
          kind: "configuration-not-written",
          file,
          message: `yumekit cannot write ${file}: ${written.failure}`,
        },
      };
    }
  }
  return {
    ok: true,
    value: await recordOf({ agent, projectFolder: options.projectFolder }),
  };
}
