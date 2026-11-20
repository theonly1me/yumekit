# @yumekit/project

The project folder format and its schema.

## What this package owns

- The folder format and the schema.
- Validation and undo history.
- Change events for each edit.

## Interface

The planned interface is: `openProject`, `applyEdit`, `undo`, `subscribe`.

`applyEdit` is the only way to change a project.

The package is a scaffold. It has no feature logic yet.
