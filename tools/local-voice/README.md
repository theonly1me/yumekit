# @yumekit/local-voice

A media tool server that speaks on this computer with a natural voice. It needs no key, and it costs nothing.

| Model           | What it uses                                                                             | Setup                                                  |
| --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `natural-voice` | Kokoro 82M (Apache-2.0), int8, through `sherpa-onnx-node` (Apache-2.0), on the processor | One download of 148 MB at its first use, with progress |

- With no pick, yumekit uses it before the free test service, so a video with no key has a real voice.
- The voices are data in `src/naturalVoice/voices.ts`. Only a voice with `approved: true` shows in `describe_media_server` and works in `generate_speech`. Today that is Heart.
- `generate_speech` writes a WAV file and returns its length. It returns no word times. The harness spreads the words over the length of the speech.
- `generate_speech` takes `pronunciations` for a name that is not in the word list, for example `{"Hoshi": "hoe she"}`. The voice says the name as one word, and the text keeps it.
- `prepare_model` downloads the model with progress. The first voice call does the same when the files are not there. The progress message is "Getting the natural voice, one time, 148 MB".
- The download goes to `voices/kokoro-int8-multi-lang-v1_0` in the configuration folder of yumekit (`YUMEKIT_CONFIG_DIRECTORY`, or `~/.config/yumekit`). It never goes into a project. The server checks the size and the SHA-256 of each file, and keeps no file that does not match.
- With no network, the download fails with "The voice needs one download. Connect to the internet and try again."
- The voice says numbers, prices, and percents as words. It refuses a text with a word that its word list does not have, and names the word, so it never leaves a word out with no sound.

Run it with `yumekit-local-voice`. It reads MCP messages on stdin and writes them on stdout.
