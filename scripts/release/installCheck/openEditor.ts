import { setTimeout as delay } from "node:timers/promises";
import { startProgram, stopProgram } from "./processes.ts";

const urlPattern = /http:\/\/127\.0\.0\.1:\d+\/\?token=[0-9a-f]+/;
const scriptPattern = /<script[^>]*src="([^"]+)"/;
const startWaitMilliseconds = 60_000;

async function fetchText(url: string): Promise<{ type: string; text: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${String(response.status)}`);
  }
  return {
    type: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
}

export async function checkEditorPage(options: {
  command: string;
  args: string[];
  cwd: string;
}): Promise<string> {
  const child = startProgram({
    command: options.command,
    args: options.args,
    cwd: options.cwd,
  });
  const output: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  try {
    const deadline = Date.now() + startWaitMilliseconds;
    let match = urlPattern.exec(output.join(""));
    while (match === null && Date.now() < deadline && child.exitCode === null) {
      await delay(100);
      match = urlPattern.exec(output.join(""));
    }
    const [url] = match ?? [];
    if (url === undefined) {
      throw new Error(
        `yumekit ${options.args.join(" ")} did not start:\n${output.join("")}`,
      );
    }
    const page = await fetchText(url);
    const [, scriptPath] = scriptPattern.exec(page.text) ?? [];
    if (scriptPath === undefined) {
      throw new Error(`The editor page has no script:\n${page.text}`);
    }
    const script = await fetchText(new URL(scriptPath, url).href);
    if (!script.type.includes("javascript") || script.text.length < 1000) {
      throw new Error(`The editor script is not served: ${script.type}`);
    }
    return `${new URL(scriptPath, url).pathname} (${String(script.text.length)} characters)`;
  } finally {
    await stopProgram(child);
  }
}
