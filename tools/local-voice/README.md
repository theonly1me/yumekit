# @yumekit/local-voice

A media tool server that speaks on this computer. It needs no key, and it costs nothing.

| Model           | What it uses                                                                                             | Setup                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `system-voice`  | The voice of the operating system: `say` on macOS, the speech interface of Windows, `espeak-ng` on Linux | None on macOS and Windows. On Linux, install `espeak-ng` |
| `natural-voice` | Kokoro 82M (Apache-2.0), int8, through `sherpa-onnx-node` (Apache-2.0), on the processor                 | One download of 148 MB at its first use, with progress   |

- `system-voice` is the default. With no pick, yumekit uses it before the free test service, so a video with no key has a real voice.
- `generate_speech` writes a WAV file and returns its length. It returns no word times. Call `align_words` after it.
- `describe_media_server` lists the English voices of this computer as the `voice` setting of `system-voice`, best first: a premium voice, an enhanced voice, then a plain voice. It leaves out the novelty voices of macOS.
- `natural-voice` has 9 American English voices: Heart (the default), Bella, Nicole, Sarah, Kore, Aoede, Michael, Fenrir, and Puck.
- The download goes to `voices/kokoro-int8-multi-lang-v1_0` in the configuration folder of yumekit (`YUMEKIT_CONFIG_DIRECTORY`, or `~/.config/yumekit`). It never goes into a project. The server checks the size and the SHA-256 of each file, and keeps no file that does not match.
- `natural-voice` says numbers, prices, and percents as words. It refuses a text with a word that its word list does not have, and names the word, so it never leaves a word out without a sound.
- Speaking uses no network. Only the first download of `natural-voice` does.

Run it with `yumekit-local-voice`. It reads MCP messages on stdin and writes them on stdout.
