# @yumekit/fal-media

A media tool server that makes video clips with models that fal hosts. It uses the fal API key of the user, so each second of video costs money.

| Tool                    | Result                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `generate_video`        | An MP4 clip from a prompt, with an optional first frame and last frame. Sound is on by default |
| `describe_media_server` | The key, the models, their settings, and their prices. Needs no key and makes no request       |
| `check_key`             | `{ valid, message }` from one request to the fal price list, which runs no model               |

## Models

| Model        | Id                          | fal endpoints                                                                          |
| ------------ | --------------------------- | -------------------------------------------------------------------------------------- |
| Seedance 2.5 | `bytedance/seedance-2.5/us` | `bytedance/seedance-2.5/us/text-to-video`, and `.../image-to-video` with a first frame |

- `duration_seconds` is a whole number from 4 to 30.
- `resolution` is `480p`, `720p`, `1080p`, or `4k`. The default is `720p`.
- Without a first frame, the server picks the nearest shape to `width_pixels` and `height_pixels`. With a first frame, the clip takes the shape of that image.
- `cost_usd` is an estimate from the price for one second on 2026-11-21: 0.2205 US dollars at 480p, 0.4730 at 720p, 1.164 at 1080p, and 1.840 at 4K.

## Setup

1. Create a key with the API preset at https://fal.ai/dashboard/keys.
2. Set `FAL_KEY` in your shell.
3. The `yumekit` command bundles this server as `fal`, and passes it `FAL_KEY`. For another MCP client, add it to `media-tools.json`:

```json
{
  "mcpServers": {
    "fal": {
      "command": "yumekit-fal-media",
      "args": [],
      "passEnvironment": ["FAL_KEY"]
    }
  },
  "defaults": { "video": "fal" }
}
```

Run it with `yumekit-fal-media`. It reads MCP messages on stdin and writes them on stdout.
