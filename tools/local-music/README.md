# @yumekit/local-music

A media tool server that makes a music bed on this computer, from code. It needs no key, no download, and no network, and it costs nothing.

| Model       | What it makes                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `music-bed` | Drums, a bass, chords, and a lead at a tempo, for the length of the call, with a clean end hit |

- The styles are data in `src/styles/styleList.ts`: `minimal`, `warm`, `bright`, `night`, and `cinematic`. Each has a name, one plain line, and `approved`. The owner approves a style by ear, and a pull request sets `approved` to true.
- A release offers only the approved styles. With no approved style, the server has no `generate_music` and no model, so a release has no music of this computer yet.
- A build from the source (the folder `src` is next to `dist`) also offers each waiting style, so the owner can try it. The editor shows such a style with "Not approved yet".
- `generate_music` takes `prompt`, `duration_seconds` (up to 180), and optionally `style`, `tempo` (60 to 200, 110 by default), `seed`, and `energy` (2 to 8 values from 0 to 1 over the length). With no `style`, the words of the prompt pick one.
- The same input gives the same bytes. Another `seed` gives another version of the same style: another key, chord order, or pattern.
- The file is a stereo WAV at 48 kHz, leveled to -17 LUFS with a peak at -1.5 dBFS. The mix has a small dip around 2.6 kHz, so a voice stays clear above it.

Run it with `yumekit-local-music`. It reads MCP messages on stdin and writes them on stdout.
