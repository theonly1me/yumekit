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

## Details of the package

WP34 chose these details.

- The publish folder is `release/package`. It holds `package.json`, `README.md`, `LICENSE`, and `lib/node_modules/@yumekit/<name>` for each workspace package in the package.
- Node.js finds `@yumekit/*` in `lib/node_modules` by its normal search. The outside dependencies are in the `node_modules` folder that npm makes.
- The packages stay side by side, as in `packages/` and `apps/`. So the relative paths of the code still work, for example the path from the command to the built editor.
- The package does not use `bundleDependencies`. With it, a global install on macOS failed with npm 11.11.0. npm ran the install script of the registry metadata of `fsevents`, an optional dependency of Vite, in a folder with no `binding.gyp`.
- The package does not bundle the Node.js code. The renderer gives the scene kit, the stage, and its page files to Vite as files, and finds them by package name.
- The set of packages is `@yumekit/cli` and each workspace package that it needs through `dependencies`. `@yumekit/editor` adds its built files only.
- `@yumekit/tools` depends on the five bundled media servers, so they are in the set. `findBundledServers` finds `@yumekit/<server>/package.json` by name and starts `dist/main.js` in that folder. Before WP34 it used a path relative to the repository.
- `pack-release` gathers the `dependencies` of each package in the set, except `@yumekit/*` and the editor. The editor has its dependencies in its built files.
- `pack-release` stops when a version is not exact, when two packages need different versions, or when no package in the set gives a peer dependency. It names each problem.
- The version of a release is the `version` of the root `package.json`. The publish folder writes it into each copied `package.json`. So `yumekit --version` and the engine show the release version.
- Each copy holds the `files` entries of its workspace package: `dist`, and also `fonts` for the scene kit. The copy leaves out tests, `testing` folders, source maps, and `.tsbuildinfo` files.
- Declaration files (`.d.ts`) ship. The check of custom scene code reads the types of `@yumekit/scene`, the scene kit, and React.
- Each copied `package.json` has only `name`, `version`, `type`, and `exports`. So no copy has a script or a dependency.
- `pack-release` reads the `.tgz` with `tar`. It stops for a file outside the folders of the set, `package.json`, `README.md`, and `LICENSE`.
- It also stops for a test, a test helper, a source map, an `.env` file, TypeScript source, a design file, a key file, a value in the form of an API key, and an install script in any `package.json`.
- `pack-release` prints the layout, the dependencies, the size, and the file count. The full file list is in `release/files.txt`.
- `pnpm run check-release` installs the `.tgz` in a temporary folder, with a temporary npm cache, and runs check 2. With `--global` it uses a temporary npm prefix.
- `yumekit setup` runs `install chromium` of the `playwright-core` package in yumekit. That gets Chromium and the Chromium headless shell, as CI does.
- `yumekit doctor` starts and stops Chromium with the code of the renderer. So it finds what a render finds.
- `main.js` checks the version of Node.js before it loads the other modules.
- `serverCommand` names `process.execPath` and the real path of the installed `main.js`. For a global or a local install, that path stays.
- With `npx`, the path is in the npx cache (`_npx/<hash>`), and it works until the cache is cleared. yumekit keeps this path. The README says to install yumekit for an agent entry that stays, and gives the `npx -y yumekit` form for an entry by hand.

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
