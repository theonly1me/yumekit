import type { Note } from "./score.ts";

const tiedParts = new Set(["pad"]);
const joinSeconds = 0.002;

export function tiedNotesOf(notes: readonly Note[]): Note[] {
  const loose = notes.filter((note) => !tiedParts.has(note.part));
  const held = notes
    .filter((note) => tiedParts.has(note.part))
    .toSorted(
      (...[first, second]) =>
        first.pitch - second.pitch || first.startSeconds - second.startSeconds,
    );
  const joined: Note[] = [];
  for (const note of held) {
    const last = joined.at(-1);
    const lastEnd =
      last === undefined ? -1 : last.startSeconds + last.lengthSeconds;
    if (
      last?.pitch === note.pitch &&
      last.part === note.part &&
      Math.abs(lastEnd - note.startSeconds) < joinSeconds
    ) {
      joined[joined.length - 1] = {
        ...last,
        lengthSeconds:
          note.startSeconds + note.lengthSeconds - last.startSeconds,
      };
    } else {
      joined.push(note);
    }
  }
  return [...loose, ...joined];
}
