# @yumekit/openai-media

A media tool server that makes images and speech, and aligns words, with the OpenAI API. It uses the API key of the user, so each call costs money.

| Tool              | Result                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `generate_image`  | A PNG from the OpenAI image API. With `reference_image_paths`, it uses the image edits endpoint  |
| `generate_speech` | A WAV file of speech with its length. It returns no word timings, so call `align_words` after it |
| `align_words`     | The start and the end of each spoken word, in seconds. It writes no file                         |

## Models

OpenAI retires models often. Each tool has a default model, and an environment variable replaces it. List the variable in `passEnvironment`.

| Tool              | Default model         | Variable                      | Shutdown by OpenAI |
| ----------------- | --------------------- | ----------------------------- | ------------------ |
| `generate_image`  | `gpt-image-2.5-flare` | `YUMEKIT_OPENAI_IMAGE_MODEL`  | No date            |
| `generate_speech` | `gpt-4o-mini-tts`     | `YUMEKIT_OPENAI_SPEECH_MODEL` | 2027-01-06         |
| `align_words`     | `whisper-1`           | `YUMEKIT_OPENAI_ALIGN_MODEL`  | 2027-02-26         |

The catalog also lists `gpt-image-2.5-sunburst`, `gpt-image-2.6-flare`, and `gpt-image-2.6-sunburst` for pictures, and `tts-1` and `tts-1-hd` for voice. `tts-1` and `tts-1-hd` take 9 voices and no `instructions`. OpenAI has no video model in its API since 2026-09-24. Document 16, "Details of WP46", has the facts of 2026-11-22.

After a shutdown date, the tool fails with the message of the API. Set the variable to a model that the OpenAI documents still list for the same endpoint. `align_words` needs a model that returns word timestamps.

## Description and key check

- `describe_media_server` gives the key, the models, their settings, and their prices. It makes no request. See document 10 for the facts and their date.
- `check_key` lists the models with the key, which is a free request, and returns `{ valid, message }`.
- Each tool accepts the optional input `model`. An unknown id is rejected with the list of ids, before any request.

## Setup

1. Create a key at https://platform.openai.com/api-keys.
2. Run `yumekit keys set OPENAI_API_KEY` and paste the key at the hidden prompt. An `OPENAI_API_KEY` in your shell wins over the key file.
3. Add the bundled server to `media-tools.json`. The bundled entry already passes `OPENAI_API_KEY` and the model variables:

```json
{
  "mcpServers": { "openai": {} },
  "defaults": { "image": "openai", "speech": "openai", "align": "openai" }
}
```

Run it with `yumekit-openai-media`. It reads MCP messages on stdin and writes them on stdout.
