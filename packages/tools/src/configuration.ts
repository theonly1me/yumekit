import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { capabilities } from "./convention.js";
import type { Capability, ServerCommand } from "./types.js";

const sampleServerName = "sample";
const configurationFileName = "media-tools.json";

const serverEntrySchema = z.object({
  command: z.string().min(1).optional(),
  args: z.array(z.string()).optional(),
  passEnvironment: z.array(z.string()).optional(),
});

const configurationFileSchema = z.object({
  mcpServers: z.record(z.string(), serverEntrySchema).default({}),
  defaults: z.partialRecord(z.enum(capabilities), z.string()).default({}),
});

type ServerEntry = z.infer<typeof serverEntrySchema>;
type ConfigurationFile = z.infer<typeof configurationFileSchema>;

export type ConfiguredServer =
  | { name: string; status: "ready"; command: ServerCommand }
  | { name: string; status: "invalid"; message: string };

export interface MediaToolsConfiguration {
  servers: ConfiguredServer[];
  defaults: Partial<Record<Capability, string>>;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readConfigurationFile(
  path: string,
): Promise<ConfigurationFile | undefined> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
  const parsed = configurationFileSchema.safeParse(parseJson({ path, text }));
  if (!parsed.success) {
    throw new Error(
      `${path} is not a valid media tools file: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

function parseJson(options: { path: string; text: string }): unknown {
  try {
    return JSON.parse(options.text);
  } catch (error) {
    throw new Error(`${options.path} is not valid JSON`, { cause: error });
  }
}

function resolveServer(options: {
  name: string;
  entry: ServerEntry;
  bundledServers: Record<string, ServerCommand>;
}): ConfiguredServer {
  const { name, entry } = options;
  const base = entry.command
    ? { command: entry.command, args: [] }
    : options.bundledServers[name];
  if (!base) {
    return {
      name,
      status: "invalid",
      message: `Server "${name}" has no command, and no bundled server has that name`,
    };
  }
  const passEnvironment = entry.passEnvironment ?? base.passEnvironment;
  const command: ServerCommand = {
    command: base.command,
    args: entry.args ?? base.args,
    ...(passEnvironment ? { passEnvironment } : {}),
  };
  return { name, status: "ready", command };
}

function bundledSampleOnly(
  bundledServers: Record<string, ServerCommand>,
): MediaToolsConfiguration {
  const sample = bundledServers[sampleServerName];
  return {
    servers: sample
      ? [{ name: sampleServerName, status: "ready", command: sample }]
      : [],
    defaults: {},
  };
}

export async function readMediaToolsConfiguration(options: {
  projectFolder: string;
  bundledServers: Record<string, ServerCommand>;
}): Promise<MediaToolsConfiguration> {
  const userFile = await readConfigurationFile(
    join(homedir(), ".config", "yumekit", configurationFileName),
  );
  const projectFile = await readConfigurationFile(
    join(options.projectFolder, configurationFileName),
  );
  if (!userFile && !projectFile) {
    return bundledSampleOnly(options.bundledServers);
  }
  const entries = {
    ...userFile?.mcpServers,
    ...projectFile?.mcpServers,
  };
  return {
    servers: Object.entries(entries).map(([name, entry]) =>
      resolveServer({ name, entry, bundledServers: options.bundledServers }),
    ),
    defaults: { ...userFile?.defaults, ...projectFile?.defaults },
  };
}
