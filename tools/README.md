# tools

This folder holds the bundled media tool servers. Each server has its own folder and is one MCP server over stdio.

| Folder         | Command                | Capabilities                                                                            |
| -------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `sample-media` | `yumekit-sample-media` | `image`, `speech`, `align`, `music`, `video`, `sound-effect`, `talking-clip`, `sharper` |
| `gemini-media` | `yumekit-gemini-media` | `video`                                                                                 |
| `fal-media`    | `yumekit-fal-media`    | `image`, `video`, `sound-effect`, `talking-clip`, `sharper`                             |
| `local-voice`  | `yumekit-local-voice`  | `speech`                                                                                |

The servers import nothing from the yumekit packages.
