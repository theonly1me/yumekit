import { dirname } from "node:path";
import {
  commandAccessOf,
  pathAccessOf,
  type AccessFolders,
} from "./fileAccess.js";

export interface PermissionAsk {
  what: string;
  detail: string;
  folder?: string;
  rule?: string;
}

export interface ProgramToolCall {
  toolName: string;
  input: Record<string, unknown>;
}

const fileReadTools = new Set(["Read", "Grep", "Glob", "LSP"]);

const fileEditTools = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);

const longestDetail = 400;

function textOf(options: { input: Record<string, unknown>; field: string }) {
  const value = options.input[options.field];
  return typeof value === "string" ? value : undefined;
}

function shortOf(text: string): string {
  return text.length > longestDetail
    ? `${text.slice(0, longestDetail - 1)}…`
    : text;
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function folderAskOf(options: {
  call: ProgramToolCall;
  folders: AccessFolders;
}): PermissionAsk {
  const { input, toolName } = options.call;
  const filePath = textOf({ input, field: "file_path" });
  const path =
    filePath === undefined
      ? (textOf({ input, field: "path" }) ?? ".")
      : dirname(filePath);
  const access = pathAccessOf({ path, folders: options.folders });
  const folder = access.kind === "outside" ? access.folder : path;
  return {
    what:
      toolName === "Read"
        ? "Read a file outside the project"
        : "Look through a folder outside the project",
    detail: filePath ?? folder,
    folder,
  };
}

function commandAskOf(options: {
  command: string;
  folders: AccessFolders;
}): PermissionAsk {
  const access = commandAccessOf(options);
  return {
    what:
      access.kind === "outside"
        ? "Run a command that reaches outside the project"
        : "Run a command",
    detail: shortOf(options.command),
    rule: `Bash(${options.command})`,
  };
}

export function permissionAskOf(options: {
  call: ProgramToolCall;
  folders: AccessFolders;
}): PermissionAsk {
  const { toolName, input } = options.call;
  if (fileReadTools.has(toolName)) return folderAskOf(options);
  const command = textOf({ input, field: "command" });
  if (toolName === "Bash" && command !== undefined) {
    return commandAskOf({ command, folders: options.folders });
  }
  const url = textOf({ input, field: "url" });
  const host = url === undefined ? undefined : hostOf(url);
  if (toolName === "WebFetch" && url !== undefined && host !== undefined) {
    return {
      what: "Open a web page",
      detail: shortOf(url),
      rule: `WebFetch(domain:${host})`,
    };
  }
  const query = textOf({ input, field: "query" });
  if (toolName === "WebSearch" && query !== undefined) {
    return { what: "Search the web", detail: shortOf(query), rule: toolName };
  }
  const filePath =
    textOf({ input, field: "file_path" }) ??
    textOf({ input, field: "notebook_path" });
  if (fileEditTools.has(toolName) && filePath !== undefined) {
    return {
      what: "Change a file",
      detail: filePath,
      rule: `Edit(/${filePath})`,
    };
  }
  const server = /^mcp__(.+?)__(.+)$/.exec(toolName);
  if (server !== null) {
    const [, serverName = "", tool = ""] = server;
    return {
      what: `Use the tool ${tool} of ${serverName}`,
      detail: shortOf(JSON.stringify(input)),
      rule: toolName,
    };
  }
  return {
    what: `Use ${toolName}`,
    detail: shortOf(JSON.stringify(input)),
    rule: toolName,
  };
}

export function keyOfAsk(ask: PermissionAsk): string {
  return ask.folder === undefined
    ? `rule ${ask.rule ?? ask.what}`
    : `folder ${ask.folder}`;
}
