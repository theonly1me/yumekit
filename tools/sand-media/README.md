# @yumekit/sand-media

A media tool server that makes video clips with MAGI-2, the video model of Sand AI. It uses the Sand AI API key of the user, so each second of video costs money.

| Tool                    | Result                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `generate_video`        | An MP4 clip of 4 to 30 seconds at 1080p, from a prompt, a first frame and a last frame, or reference images |
| `describe_media_server` | The model, its settings, its price, and the key. Free, with no network request                              |
| `check_key`             | `{ valid, message }` from one free request that reads a generation that is not there                        |

## Model and price

| Model    | Lengths   | Size  | Sound      | Price on 2026-11-26             |
| -------- | --------- | ----- | ---------- | ------------------------------- |
| `magi-2` | 4 to 30 s | 1080p | On, or off | 0.08 US dollars for each second |

- The clip takes one of the shapes 21:9, 16:9, 4:3, 1:1, 3:4, and 9:16. The server picks the nearest one to `width_pixels` and `height_pixels`, and 16:9 with no size.
- A first frame and a last frame go to the Ark compatible API of Sand AI with the roles `first_frame` and `last_frame`, so the clip starts and ends on those pictures. The native API of Sand AI takes no first frame.
- Reference pictures (up to 10) keep a person, a place, or a product in the clip. They cannot go with a first or a last frame.
- `cost_usd` in a result is an estimate: 0.08 US dollars times the length of the clip.

Not tested with a real key yet. Tests use recorded shapes from the Sand AI documents of 2026-11-26.

## Setup

1. Sign in at https://platform.sand.ai and create a key on the API keys page.
2. Run `yumekit keys set SAND_API_KEY`, or set `SAND_API_KEY` in your shell.
3. Check your balance on the Usage page of the platform.

`yumekit` bundles this server with the name `sand`, and passes `SAND_API_KEY` to it.

Run it with `yumekit-sand-media`. It reads MCP messages on stdin and writes them on stdout.
