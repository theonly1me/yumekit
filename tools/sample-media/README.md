# @yumekit/sample-media

A free media tool server for tests and for work on yumekit. It uses no network and no model. The same input gives the same file.

| Tool              | Result                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_image`  | A PNG with a color from a hash of the prompt and the prompt as text. 1024 by 1024 by default                                                                              |
| `generate_speech` | A WAV file with a quiet tone, 0.3 seconds for each word, and even word timings                                                                                            |
| `align_words`     | Even word timings over the length of a WAV file. It writes no file                                                                                                        |
| `generate_music`  | A WAV file with a low tone of the requested length                                                                                                                        |
| `generate_video`  | An MP4 at 24 frames per second with a color from a hash of the prompt, a frame counter, and a quiet tone. 1280 by 720, or 720 by 1280 for a tall request. It needs FFmpeg |

Run it with `yumekit-sample-media`. It reads MCP messages on stdin and writes them on stdout.
