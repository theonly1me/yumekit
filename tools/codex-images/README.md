# @yumekit/codex-images

A media tool server that makes a picture with the Codex program of the person. It uses their ChatGPT plan and needs no key. yumekit counts each picture as 0 US dollars.

- `generate_image` runs one short `codex exec` turn in an empty temporary folder, with a read-only sandbox, no shell, no web search, no user configuration, and no saved session.
- Codex picks the exact size. `width_pixels` and `height_pixels` set the shape: landscape, portrait, or square. A picture of another shape is a failure.
- `reference_image_paths` takes up to 5 absolute paths of pictures that guide the picture.
- `check_key` checks for free that Codex is installed, signed in with ChatGPT, and has the picture feature.
- A usage limit of the plan is a failure with `_meta: { "yumekit/failure": "usage-limit-reached" }`.
- `YUMEKIT_CODEX_PATH` names the Codex program. With no value, the server uses the first `codex` on the `PATH`. `CODEX_HOME` names the Codex folder, `~/.codex` by default.

Document 06 and document 15 ("Details of WP67") of `docs/design` have the rules and the sources.

Run it with `yumekit-codex-images`. It reads MCP messages on stdin and writes them on stdout.
