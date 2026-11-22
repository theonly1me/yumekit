# 14. Install and release

A person installs yumekit with one command, and an agent starts it with `npx`. Today the only way is a clone of the repository and a build.

## Decisions

| Id  | Decision                                                                                                                             | Why                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| N1  | One npm package with the name `yumekit`. No `@yumekit/*` package is published                                                        | One install and one version. The name was free on 2026-11-22        |
| N2  | The package holds the command, the engine, the built editor, the harness, the renderer, the scene kit, and the bundled media servers | A person needs nothing more to make a video                         |
| N3  | The workspace packages stay private. A build step makes the folder that is published                                                 | The repository keeps its package map and its import rules           |
| N4  | Each dependency from outside is a normal dependency with an exact version                                                            | npm installs it. The package holds no copy of it                    |
| N5  | The package has no install script. It downloads nothing at install                                                                   | An install script is a risk for each person who installs            |
| N6  | `yumekit doctor` checks what the computer needs. `yumekit setup` gets the browser of the renderer                                    | A person learns what is missing before the first render             |
| N7  | Only the owner publishes. An agent never runs `npm publish`                                                                          | A release is not reversible                                         |
| N8  | CI installs the packed file in a clean folder and uses it                                                                            | A package that works only inside the repository is the usual defect |

## The package

- The name is `yumekit`, and the command is `yumekit`. `npx yumekit <command>` works.
- It needs Node.js 22 or later. The field `engines` says so.
- The first version is `0.1.0`. Each workspace package keeps `0.0.0` and `private`.
- `pnpm run pack-release` builds the repository, makes the publish folder, and runs `npm pack` there. The result is one `.tgz` file in a folder that git ignores.
- The builder chooses how the publish folder holds the code of the workspace packages, and records it here. The choice must keep these rules:
  1. The scene code of a project imports the scene kit and React. The renderer and the preview resolve these from the installed package, not from the project folder. A project folder has no `node_modules`.
  2. The bundled media servers start as child processes with the full path of their file in the installed package.
  3. The editor is served from its built files in the installed package.
  4. `serverCommand` of document 11 names the installed command, so an agent configuration still works.
- The package has a `files` list. It holds the built code, the editor files, the fonts, the README, and the license. It holds no test, no source of the repository, no design document, and no prototype.
- The README of the package is the root README. It gets the sections "Install", "First video", and "Use an agent", and its status line is corrected.

## What the computer needs

| Need                    | How yumekit finds it             | When it is missing                                               |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Node.js 22 or later     | `process.versions.node`          | The command stops with one sentence                              |
| FFmpeg                  | `ffmpeg` on the `PATH`           | `doctor` gives the install command for macOS, Linux, and Windows |
| Chromium for Playwright | The browser folder of Playwright | `doctor` says to run `yumekit setup`                             |
| An agent program        | `listAgents` of document 11      | `doctor` lists which ones it found. None is not a failure        |

- `yumekit doctor` prints one line for each need, with "ok" or what to do. It exits with 1 when FFmpeg, Chromium, or Node.js is missing.
- `yumekit setup` runs the browser install of Playwright for Chromium only, with the Playwright version of the package. It prints the progress of that install.
- A render or a preview that cannot start the browser gives a failure whose hint names `yumekit setup`.

## Release

1. The owner signs in to npm on the computer.
2. `pnpm run pack-release` makes the file. The owner reads the file list that it prints.
3. The owner runs `npm publish <file> --access public`.
4. The owner makes a git tag `v<version>` on the commit.

A later change can move the release to GitHub Actions with trusted publishing.

## Work package

| Id   | Scope                                                                                                                     | Needs |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP34 | The publish folder and `pack-release`, `yumekit doctor`, `yumekit setup`, the README, and the CI check of the packed file |       |

### WP34 checks

1. In a clean folder outside the repository, `npm install <file>` works with no workspace and no pnpm.
2. From that install: `yumekit init` makes a project, `yumekit mcp` answers `tools/list`, a project with a kit scene and a custom scene renders a short video that `ffprobe` reads, `yumekit open --no-browser` serves the editor page and its script files, and the sample media server makes an asset.
3. `yumekit doctor` reports a missing FFmpeg and a missing browser, each with its fix, and exits with 1.
4. The packed file holds no test file, no `.env` file, no key, and no file outside the `files` list. The check prints its size and its file count.
5. CI runs checks 1, 2, and 4 on each pull request.
