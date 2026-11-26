const ownPrefix = "yumekit-";
const randomEnding = /^(yumekit-.*-)[A-Za-z0-9]{6}$/;

function prefixOf(name: string): string {
  const [, prefix] = randomEnding.exec(name) ?? [];
  return prefix === undefined ? name : `${prefix}*`;
}

export function leftFoldersFailure(names: string[]): string | undefined {
  const left = names.filter((name) => name.startsWith(ownPrefix));
  if (left.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const name of left) {
    const prefix = prefixOf(name);
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  const listed = [...counts]
    .toSorted(
      (...[first, second]) =>
        second[1] - first[1] || first[0].localeCompare(second[0]),
    )
    .map(([prefix, count]) => `${prefix} (${String(count)})`)
    .join(", ");
  const folders =
    left.length === 1 ? "1 folder" : `${String(left.length)} folders`;
  return `The tests left ${folders} in the temporary folder: ${listed}. Remove each folder when its test ends, for example with onTestFinished.`;
}
