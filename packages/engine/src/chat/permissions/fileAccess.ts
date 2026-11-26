import { homedir, tmpdir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";

export interface AccessFolders {
  projectFolder: string;
  allowedFolders: readonly string[];
  keysFolders: readonly string[];
}

export type PathAccess =
  { kind: "open" } | { kind: "closed" } | { kind: "outside"; folder: string };

export function isPathWithin(options: {
  folder: string;
  path: string;
}): boolean {
  const between = relative(options.folder, options.path);
  return (
    between === "" ||
    (between !== ".." &&
      !between.startsWith(`..${sep}`) &&
      !isAbsolute(between))
  );
}

const freeFolders = [
  tmpdir(),
  "/tmp",
  "/private/tmp",
  "/var/folders",
  "/private/var/folders",
  "/dev",
];

export function expandedPathOf(options: {
  path: string;
  projectFolder: string;
}): string {
  const { path } = options;
  const home = homedir();
  if (path === "~" || path === "$HOME") return home;
  if (path.startsWith("~/")) return resolve(home, path.slice(2));
  if (path.startsWith("$HOME/")) return resolve(home, path.slice(6));
  return resolve(options.projectFolder, path);
}

export function pathAccessOf(options: {
  path: string;
  folders: AccessFolders;
}): PathAccess {
  const { folders } = options;
  const path = expandedPathOf({
    path: options.path,
    projectFolder: folders.projectFolder,
  });
  const isIn = (folder: string) => isPathWithin({ folder, path });
  if (folders.keysFolders.some(isIn)) return { kind: "closed" };
  const openFolders = [
    folders.projectFolder,
    ...folders.allowedFolders,
    ...freeFolders,
  ];
  return openFolders.some(isIn)
    ? { kind: "open" }
    : { kind: "outside", folder: path };
}

const tokenSeparators = /[\s;|&<>(){}`]+/;

function pathOfToken(token: string): string | undefined {
  const unquoted = token.replace(/^['"]+|['"]+$/g, "");
  const equals = unquoted.indexOf("=");
  const value = equals === -1 ? unquoted : unquoted.slice(equals + 1);
  if (value.includes("://")) return undefined;
  const isFromRoot = value.startsWith("/") || /^(~|\$HOME)(\/|$)/.test(value);
  return isFromRoot || value.split("/").includes("..") ? value : undefined;
}

export function pathsOfCommand(command: string): string[] {
  return command.split(tokenSeparators).flatMap((token) => {
    const path = pathOfToken(token);
    return path === undefined ? [] : [path];
  });
}

export function commandAccessOf(options: {
  command: string;
  folders: AccessFolders;
}): PathAccess {
  const accesses = pathsOfCommand(options.command).map((path) =>
    pathAccessOf({ path, folders: options.folders }),
  );
  const closed = accesses.find((access) => access.kind === "closed");
  if (closed !== undefined) return closed;
  return (
    accesses.find((access) => access.kind === "outside") ?? { kind: "open" }
  );
}
