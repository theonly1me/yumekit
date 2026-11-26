import { serverName, type RunAccess } from "../brainTypes.js";
import { fileCheckToolName, permissionToolName } from "../leadTools.js";

export const claudeServerToolPrefix = `mcp__${serverName}__`;

type ProgramAccess = Extract<RunAccess, { kind: "program" }>;

const lockedArguments = [
  "--strict-mcp-config",
  ...["--tools", ""],
  ...["--allowedTools", `${claudeServerToolPrefix}*`],
  ...["--permission-mode", "dontAsk"],
  ...["--setting-sources", ""],
];

function posixPathOf(path: string): string {
  const drive = /^([A-Za-z]):[\\/]/.exec(path);
  if (drive === null) return path;
  const [whole, letter = ""] = drive;
  const rest = path.slice(whole.length).replaceAll("\\", "/");
  return `/${letter.toLowerCase()}/${rest}`;
}

export function claudePathPatternOf(path: string): string {
  const escaped = posixPathOf(path)
    .replace(/\/+$/, "")
    .replace(/[*?[\]\\]/g, (character) => `\\${character}`);
  return `/${escaped}`;
}

function denyRulesOf(access: ProgramAccess): string[] {
  const folderRule = (tool: string) => (folder: string) =>
    `${tool}(${claudePathPatternOf(folder)}/**)`;
  return [
    ...access.closedFolders.flatMap((folder) => [
      folderRule("Read")(folder),
      folderRule("Edit")(folder),
    ]),
    ...access.readOnly.files.map(
      (file) => `Edit(${claudePathPatternOf(file)})`,
    ),
    ...access.readOnly.folders.map(folderRule("Edit")),
  ];
}

function fileCheckHook(options: {
  matcher: string;
  input: Record<string, string>;
}) {
  return {
    matcher: options.matcher,
    hooks: [
      {
        type: "mcp_tool",
        server: serverName,
        tool: fileCheckToolName,
        input: options.input,
      },
    ],
  };
}

export function claudeSettingsOf(access: ProgramAccess) {
  return {
    permissions: { deny: denyRulesOf(access) },
    hooks: {
      PreToolUse: [
        fileCheckHook({
          matcher: "Read",
          input: { tool: "Read", path: "${tool_input.file_path}" },
        }),
        fileCheckHook({
          matcher: "Grep|Glob",
          input: { tool: "${tool_name}", path: "${tool_input.path}" },
        }),
        fileCheckHook({
          matcher: "Bash",
          input: { tool: "Bash", command: "${tool_input.command}" },
        }),
      ],
    },
  };
}

export function claudeAccessArgumentsOf(
  access: RunAccess | undefined,
): string[] {
  if (access === undefined || access.kind === "yumekit-only") {
    return lockedArguments;
  }
  return [
    ...["--allowedTools", `${claudeServerToolPrefix}*`, ...access.allowedRules],
    ...["--permission-mode", "auto"],
    ...[
      "--permission-prompt-tool",
      `${claudeServerToolPrefix}${permissionToolName}`,
    ],
    ...["--settings", JSON.stringify(claudeSettingsOf(access))],
    ...access.readFolders.flatMap((folder) => ["--add-dir", folder]),
  ];
}
