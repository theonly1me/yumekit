# @yumekit/fal-media

A media tool server that makes pictures, video clips, sound effects, and sharper copies with models that fal hosts. It uses the fal API key of the user, so each picture, each sound, each copy, and each second of video costs money.

Not tested with a real key yet. Tests check each request against the schemas of the fal model pages of 2026-11-22 and 2026-11-23.

| Tool                    | Result                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `generate_image`        | A picture from a prompt, with optional reference pictures                                               |
| `generate_video`        | An MP4 clip from a prompt, with an optional first frame and last frame, or reference pictures           |
| `generate_sound_effect` | A sound effect file from a prompt, with an optional length                                              |
| `sharpen_media`         | A copy of a picture or a video clip that is 2 or 4 times wider and taller                               |
| `describe_media_server` | The key, the models, their settings, their prices, and what each model accepts. Needs no key or request |
| `check_key`             | `{ valid, message }` from one request to the fal price list, which runs no model                        |

## Models

- Pictures: Seedream 5.5 (the default), Nano Banana 2.1, FLUX 3, GPT Image 2.6 Flare, Ideogram 4.6, Qwen Image 3, MiniMax H3 Image, and Krea 3.
- Video clips: Seedance 2.5 (the default), Kling 4, Gemini Omni Flash 1.2, MiniMax H3, Wan 3.0, LTX 2.5 Pro, PixVerse 6, FLUX 3 Video, and Grok Imagine Video 1.5.
- Sound effects: ElevenLabs Sound Effects 3 (the default), Mirelo SFX 2.0, Sonilo 1.1 Sound Effects, and Stable Audio 3 Small SFX.
- Sharper copies of video: Bria Increase Resolution (the default), Topaz Precision, SeedVR2, FlashVSR+, and Crystal Upscaler. Of pictures: Bria Increase Resolution, Topaz Precision, SeedVR2, and Crystal Upscaler. A sharper model takes pictures or video, as its `accepts` says (`image_input` or `video_input`).
- `describe_media_server` gives the settings of each model. Document 16 of the design has the facts of each model page.
- The server picks the nearest shape to `width_pixels` and `height_pixels`. With a first frame, most video models take the shape of that image.
- `cost_usd` is an estimate from the price on the model page. A model whose page gives only token prices gives no `cost_usd`.

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
  "defaults": { "image": "fal", "video": "fal" }
}
```

Run it with `yumekit-fal-media`. It reads MCP messages on stdin and writes them on stdout.
