import { existsSync } from "node:fs";
import { mkdir, symlink } from "node:fs/promises";
import { delimiter, join } from "node:path";

const linkedPrograms = ["npm", "ffmpeg", "ffprobe"];
const systemFolders = ["/usr/bin", "/bin"];

function isAgentOrKeyVariable(name: string): boolean {
  return (
    name.endsWith("KEY") ||
    name.startsWith("YUMEKIT_") ||
    name.startsWith("CODEX_")
  );
}

async function linkProgramsOf(options: {
  folder: string;
  searchedPath: string;
}): Promise<void> {
  await mkdir(options.folder);
  await symlink(process.execPath, join(options.folder, "node"));
  const searched = options.searchedPath.split(delimiter);
  for (const program of linkedPrograms) {
    const found = searched
      .map((folder) => join(folder, program))
      .find((candidate) => existsSync(candidate));
    if (found !== undefined) {
      await symlink(found, join(options.folder, program));
    }
  }
}

export async function installCheckEnvironment(options: {
  folder: string;
  environment: NodeJS.ProcessEnv;
}): Promise<NodeJS.ProcessEnv> {
  const programs = join(options.folder, "programs");
  await linkProgramsOf({
    folder: programs,
    searchedPath: options.environment["PATH"] ?? "",
  });
  const kept = Object.entries(options.environment).filter(
    ([name]) => !isAgentOrKeyVariable(name),
  );
  return {
    ...Object.fromEntries(kept),
    PATH: [programs, ...systemFolders].join(delimiter),
    YUMEKIT_CONFIG_DIRECTORY: join(options.folder, "config"),
  };
}
