import { spawn } from "node:child_process";

function browserCommandOf(url: string): { command: string; args: string[] } {
  switch (process.platform) {
    case "darwin":
      return { command: "open", args: [url] };
    case "win32":
      return { command: "explorer.exe", args: [url] };
    default:
      return { command: "xdg-open", args: [url] };
  }
}

export function openBrowser(url: string): void {
  const { command, args } = browserCommandOf(url);
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {
    process.stderr.write(
      "yumekit: no browser opened. Open the URL above in a browser.\n",
    );
  });
  child.unref();
}
