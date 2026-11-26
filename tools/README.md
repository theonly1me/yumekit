# tools

This folder holds the bundled media tool servers. Each server has its own folder and is one MCP server over stdio.

| Folder         | Command                | Capabilities                                                                            |
| -------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `sample-media` | `yumekit-sample-media` | `image`, `speech`, `align`, `music`, `video`, `sound-effect`, `talking-clip`, `sharper` |
| `openai-media` | `yumekit-openai-media` | `image`, `speech`, `align`                                                              |
| `gemini-media` | `yumekit-gemini-media` | `image`, `speech`, `music`, `video`                                                     |
| `fal-media`    | `yumekit-fal-media`    | `image`, `video`, `sound-effect`, `talking-clip`, `sharper`                             |
| `sand-media`   | `yumekit-sand-media`   | `video`                                                                                 |
| `local-voice`  | `yumekit-local-voice`  | `speech`                                                                                |
| `local-music`  | `yumekit-local-music`  | `music`                                                                                 |
| `codex-images` | `yumekit-codex-images` | `image`                                                                                 |

The servers import nothing from the yumekit packages.
