import { homedir } from "node:os";
import { join } from "node:path";

export const configurationDirectoryVariable = "YUMEKIT_CONFIG_DIRECTORY";

export function configurationDirectory(): string {
  const replaced = process.env[configurationDirectoryVariable];
  if (replaced !== undefined && replaced !== "") return replaced;
  return join(homedir(), ".config", "yumekit");
}
