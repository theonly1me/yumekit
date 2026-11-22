# @yumekit/gemini-media

A media tool server that makes pictures, voice, music, and video clips with sound with the Gemini API. It uses the Gemini API key of the user, so each call costs money.

| Tool                    | Result                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `generate_image`        | A picture from a prompt and up to 14 reference images                                          |
| `generate_speech`       | A WAV file of speech with one of 30 voices                                                     |
| `generate_music`        | An MP3 file of music from a prompt and up to 10 pictures for the mood                          |
| `generate_video`        | An MP4 clip of 3 to 15 seconds from a prompt, a first frame, a last frame, or reference images |
| `describe_media_server` | The models, their settings, their prices, and the key. Free, with no network request           |
| `check_key`             | `{ valid, message }` from one free request that reads the model facts                          |

## Models

| Kind    | Models                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| Picture | `gemini-nano-banana-2.1` (default), `gemini-3.1-flash-image`, `gemini-3-pro-image`, `gemini-3.1-flash-lite-image` |
| Voice   | `gemini-3.8-flash-tts` (default), `gemini-3.8-flash-lite-tts`                                                     |
| Music   | `lyria-3.5` (default), `lyria-3-clip-preview`                                                                     |
| Video   | `gemini-omni-1.2-flash`                                                                                           |

Each tool takes the optional input `model`. Document 16, "Details of WP46", has the facts and the prices of 2026-11-22.

## Video model and price

| Default model           | Variable                     | Price on 2026-11-21                                          |
| ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| `gemini-omni-1.2-flash` | `YUMEKIT_GEMINI_VIDEO_MODEL` | About 0.07 US dollars for one second at 720p, 0.104 at 1080p |

The Gemini API has no free tier for video. `cost_usd` in a result is an estimate: the video tokens of the response at 12 US dollars for one million tokens. The variable `YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS` replaces that price.

Not tested with a real key yet. Tests use recorded shapes from the documents of 2026-11-21 and 2026-11-22.

The model always makes sound. The tool rejects `with_audio` set to false.

## Setup

1. Create a key at https://aistudio.google.com/apikey.
2. Set up billing for the Google Cloud project of the key.
3. Run `yumekit keys set GEMINI_API_KEY`, or set `GEMINI_API_KEY` in your shell.

`yumekit` bundles this server with the name `gemini`, and passes `GEMINI_API_KEY`, `YUMEKIT_GEMINI_VIDEO_MODEL`, and `YUMEKIT_GEMINI_VIDEO_USD_PER_MILLION_TOKENS` to it.

Run it with `yumekit-gemini-media`. It reads MCP messages on stdin and writes them on stdout.
