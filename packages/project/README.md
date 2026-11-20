# @yumekit/project

The project folder format, its schemas, and the store that changes it.

## What this package owns

- The folder format and the schemas (document 03).
- Validation of each edit against the store rules.
- Undo history in `.yumekit/history/`.
- Change events for each new revision.

## Interface

- `createProject` makes a new project folder and returns a `ProjectStore`.
- `openProject` reads a project folder and returns a `ProjectStore`.
- `ProjectStore` has `read`, `applyEdits`, `undo`, `redo`, `readAssetWords`, and `subscribe`.

`applyEdits` is the only way to change a project.
