import {
  commandAccessOf,
  pathAccessOf,
  type AccessFolders,
  type PathAccess,
} from "./fileAccess.js";
import {
  denyMessages,
  hookReplyOf,
  noDecisionReply,
} from "./permissionReplies.js";

export interface FileCheck {
  tool: string | undefined;
  path: string | undefined;
  command: string | undefined;
}

function pathOfCheck(path: string | undefined): string {
  return path === undefined || path === "" || path.includes("${") ? "." : path;
}

function accessOfCheck(options: {
  check: FileCheck;
  folders: AccessFolders;
}): PathAccess {
  const { check, folders } = options;
  if (check.command !== undefined && !check.command.includes("${")) {
    return commandAccessOf({ command: check.command, folders });
  }
  return pathAccessOf({ path: pathOfCheck(check.path), folders });
}

export function checkFileWith(options: {
  check: FileCheck;
  folders: AccessFolders;
}): string {
  const access = accessOfCheck(options);
  if (access.kind === "closed") {
    return hookReplyOf({ decision: "deny", reason: denyMessages.keys });
  }
  if (access.kind === "open") return noDecisionReply;
  return hookReplyOf({
    decision: "ask",
    reason: `This reaches outside the project folder, into ${access.folder}. The person decides.`,
  });
}
