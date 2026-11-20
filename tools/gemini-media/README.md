# @yumekit/gemini-media

A media tool server that makes video clips with sound with Gemini Omni Flash. It uses the Gemini API key of the user, so each clip costs money.

| Tool                    | Result                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `generate_video`        | An MP4 clip of 3 to 15 seconds from a prompt, a first frame, a last frame, or reference images |
| `describe_media_server` | The model, its settings, its prices, and the key it needs. Free, with no network request       |
| `check_key`             | `{ valid, message }` from one free request that reads the model facts                          |

## Model and price

| Default model           | Variable                     | Price on 2026-11-21                                          |
| ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| `gemini-omni-1.2-flash` | `YUMEKIT_GEMINI_VIDEO_MODEL` | About 0.07 US dollars for one second at 720p, 0.104 at 1080p |

The Gemini API has no free tier for video. `cost_usd` in a result is an estimate: the video tokens of the response at 12 US dollars for one million tokens. The variable `YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS` replaces that price.

Not tested with a real key yet. Tests use recorded shapes from the documents of 2026-11-21.

The model always makes sound. The tool rejects `with_audio` set to false.

## Setup

1. Create a key at https://aistudio.google.com/apikey.
2. Set up billing for the Google Cloud project of the key.
3. Set `GEMINI_API_KEY` in your shell.

`yumekit` bundles this server with the name `gemini`, and passes `GEMINI_API_KEY`, `YUMEKIT_GEMINI_VIDEO_MODEL`, and `YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS` to it.

Run it with `yumekit-gemini-media`. It reads MCP messages on stdin and writes them on stdout.
