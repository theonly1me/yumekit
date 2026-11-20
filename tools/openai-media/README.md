# @yumekit/openai-media

A media tool server that makes images with the OpenAI API. It uses the API key of the user, so each call costs money.

| Tool             | Result                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `generate_image` | A PNG from the OpenAI image API. With `reference_image_paths`, it uses the image edits endpoint |

| Environment variable         | Use                                                        |
| ---------------------------- | ---------------------------------------------------------- |
| `OPENAI_API_KEY`             | Required. The API key of the user                          |
| `YUMEKIT_OPENAI_IMAGE_MODEL` | Optional. Replaces the default model `gpt-image-2.5-flare` |

Add the server to `media-tools.json`:

```json
{
  "mcpServers": {
    "openai": {
      "command": "yumekit-openai-media",
      "args": [],
      "passEnvironment": ["OPENAI_API_KEY", "YUMEKIT_OPENAI_IMAGE_MODEL"]
    }
  },
  "defaults": { "image": "openai" }
}
```

Run it with `yumekit-openai-media`. It reads MCP messages on stdin and writes them on stdout.
