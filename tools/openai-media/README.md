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

After a shutdown date, the tool fails with the message of the API. Set the variable to a model that the OpenAI documents still list for the same endpoint. `align_words` needs a model that returns word timestamps.

## Setup

1. Create a key at https://platform.openai.com/api-keys.
2. Set `OPENAI_API_KEY` in your shell.
3. Add the server to `media-tools.json`:

```json
{
  "mcpServers": {
    "openai": {
      "command": "yumekit-openai-media",
      "args": [],
      "passEnvironment": [
        "OPENAI_API_KEY",
        "YUMEKIT_OPENAI_IMAGE_MODEL",
        "YUMEKIT_OPENAI_SPEECH_MODEL",
        "YUMEKIT_OPENAI_ALIGN_MODEL"
      ]
    }
  },
  "defaults": { "image": "openai", "speech": "openai", "align": "openai" }
}
```

Run it with `yumekit-openai-media`. It reads MCP messages on stdin and writes them on stdout.
