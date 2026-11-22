export const minimumNodeMajor = 22;

export function nodeVersionProblemOf(version: string): string | undefined {
  const [major = "0"] = version.split(".");
  return Number(major) >= minimumNodeMajor
    ? undefined
    : `yumekit needs Node.js ${String(minimumNodeMajor)} or later. This is Node.js ${version}.`;
}
