import { chatSettingArgumentsOf, type ChatSettings } from "./chatSettings.ts";

const featuresTurnedOff = [
  "apps",
  "plugins",
  "shell_tool",
  "unified_exec",
  "computer_use",
  "browser_use",
  "browser_use_external",
  "in_app_browser",
  "hooks",
  "multi_agent",
  "goals",
];

function setting(options: { key: string; value: string }): string[] {
  return ["-c", `${options.key}=${JSON.stringify(options.value)}`];
}

export function codexImageArgumentsOf(options: {
  prompt: string;
  workingFolder: string;
  referenceImagePaths: readonly string[];
  chatSettings: ChatSettings;
}): string[] {
  return [
    "exec",
    "--json",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    ...featuresTurnedOff.flatMap((feature) => ["--disable", feature]),
    ...["--enable", "image_generation"],
    ...["--sandbox", "read-only"],
    ...setting({ key: "approval_policy", value: "never" }),
    ...setting({ key: "web_search", value: "disabled" }),
    ...chatSettingArgumentsOf(options.chatSettings),
    ...["--cd", options.workingFolder],
    ...options.referenceImagePaths.flatMap((path) => ["--image", path]),
    "--",
    options.prompt,
  ];
}
