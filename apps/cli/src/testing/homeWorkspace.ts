import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { browsersPath } from "./processTree.js";
import { createCliWorkspace } from "./runCli.js";
import { runServing } from "./runOpen.js";

const fakeClaudeFile = fileURLToPath(
  new URL("./fakeClaudeWithBridge.ts", import.meta.url),
);

export async function startHomeWorkspace(options?: { withBrowser: boolean }) {
  const workspace = await createCliWorkspace();
  if (options?.withBrowser === true) {
    workspace.environment["PLAYWRIGHT_BROWSERS_PATH"] = browsersPath();
  }
  const projectsFolder = join(workspace.root, "projects");
  const programPath = join(workspace.root, "bin", "claude");
  await mkdir(join(programPath, ".."), { recursive: true });
  await writeFile(
    programPath,
    `#!/bin/sh\nexec "${process.execPath}" "${fakeClaudeFile}" "$@"\n`,
  );
  await chmod(programPath, 0o755);
  await mkdir(workspace.configurationDirectory, { recursive: true });
  await writeFile(
    join(workspace.configurationDirectory, "settings.json"),
    JSON.stringify({
      projectsFolder,
      agent: "claude-code",
      agentPrograms: { "claude-code": programPath },
    }),
  );
  const home = await runServing({
    args: ["--no-browser"],
    environment: workspace.environment,
  });
  const send = async (options: { path: string; body?: object }) => {
    const answer = await fetch(`${home.origin}${options.path}`, {
      method: options.body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${home.token}`,
        "content-type": "application/json",
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
    const value: unknown = await answer.json();
    return { status: answer.status, value };
  };
  return { workspace, projectsFolder, home, send };
}
