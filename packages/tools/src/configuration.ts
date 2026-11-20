import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { configurationDirectory } from "./configurationDirectory.js";
import { capabilities } from "./convention.js";
import { errorMessage } from "./errorMessage.js";
import type {
  Capability,
  ConnectFailure,
  MediaLimits,
  Outcome,
  ServerCommand,
} from "./types.js";

const sampleServerName = "sample";
const configurationFileName = "media-tools.json";
const defaultGeneratedVideoSeconds = 30;

const serverEntrySchema = z.object({
  command: z.string().min(1).optional(),
  args: z.array(z.string()).optional(),
  passEnvironment: z.array(z.string()).optional(),
});

const limitsSchema = z.object({
  generatedVideoSeconds: z.number().nonnegative().optional(),
});

const defaultEntrySchema = z
  .union([
    z.string().min(1),
    z.object({ server: z.string().min(1), model: z.string().min(1) }),
  ])
  .transform((entry): MediaDefault =>
    typeof entry === "string" ? { server: entry } : entry,
  );

const configurationFileSchema = z.object({
  mcpServers: z.record(z.string(), serverEntrySchema).default({}),
  defaults: z
    .partialRecord(z.enum(capabilities), defaultEntrySchema)
    .default({}),
  limits: limitsSchema.default({}),
});

type ServerEntry = z.infer<typeof serverEntrySchema>;
type ConfigurationFile = z.infer<typeof configurationFileSchema>;

export type ConfiguredServer =
  | { name: string; status: "ready"; command: ServerCommand }
  | { name: string; status: "invalid"; message: string };

export interface MediaDefault {
  server: string;
  model?: string;
}

export interface MediaToolsConfiguration {
  servers: ConfiguredServer[];
  defaults: Partial<Record<Capability, MediaDefault>>;
  limits: MediaLimits;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

type FileOutcome = Outcome<ConfigurationFile | undefined, ConnectFailure>;

function invalidFile(options: { file: string; message: string }): FileOutcome {
  return {
    ok: false,
    failure: { kind: "invalid-configuration-file", ...options },
  };
}

async function readConfigurationFile(file: string): Promise<FileOutcome> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return { ok: true, value: undefined };
    return invalidFile({ file, message: errorMessage(error) });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    return invalidFile({ file, message: errorMessage(error) });
  }
  const parsed = configurationFileSchema.safeParse(json);
  if (!parsed.success) {
    return invalidFile({ file, message: z.prettifyError(parsed.error) });
  }
  return { ok: true, value: parsed.data };
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
    limits: { generatedVideoSeconds: defaultGeneratedVideoSeconds },
  };
}

export async function readMediaToolsConfiguration(options: {
  projectFolder: string | undefined;
  bundledServers: Record<string, ServerCommand>;
}): Promise<Outcome<MediaToolsConfiguration, ConnectFailure>> {
  const userRead = await readConfigurationFile(
    join(configurationDirectory(), configurationFileName),
  );
  if (!userRead.ok) return userRead;
  const projectRead: FileOutcome =
    options.projectFolder === undefined
      ? { ok: true, value: undefined }
      : await readConfigurationFile(
          join(options.projectFolder, configurationFileName),
        );
  if (!projectRead.ok) return projectRead;
  const userFile = userRead.value;
  const projectFile = projectRead.value;
  if (!userFile && !projectFile) {
    return { ok: true, value: bundledSampleOnly(options.bundledServers) };
  }
  const entries = {
    ...userFile?.mcpServers,
    ...projectFile?.mcpServers,
  };
  return {
    ok: true,
    value: {
      servers: Object.entries(entries).map(([name, entry]) =>
        resolveServer({ name, entry, bundledServers: options.bundledServers }),
      ),
      defaults: { ...userFile?.defaults, ...projectFile?.defaults },
      limits: {
        generatedVideoSeconds:
          projectFile?.limits.generatedVideoSeconds ??
          userFile?.limits.generatedVideoSeconds ??
          defaultGeneratedVideoSeconds,
      },
    },
  };
}
