# @yumekit/brain

The adapters that run the agent program of the person for one chat request. Design: [12-brain-runner.md](../../docs/design/12-brain-runner.md).

## What this package owns

- One adapter for each of Claude Code, Codex, and Cursor, behind `AgentAdapter`.
- The argument list of each program, and the parser of its event stream.
- The stop of a program: `SIGINT`, then `SIGKILL` after 5 seconds.
- The instructions for the agent, and the plain sentence for a tool call by the person.
- The three files that Cursor reads from its workspace, and its configuration folder.

## Interface

```ts
function createClaudeCodeAdapter(options: {
  programPath: string;
}): AgentAdapter;
function createCodexAdapter(options: { programPath: string }): AgentAdapter;
function createCursorAdapter(options: { programPath: string }): AgentAdapter;
function findProgram(options: {
  program: string;
  searchPath: string;
}): Promise<string | undefined>;
const brainInstructions: string;
function instructionsOf(agentId: AgentId): string;
function personSentenceOf(toolName: string): string;
```

## Rules

- The adapter starts the program with `spawn`, a list of arguments, and no shell.
- The request is the last argument, after `--`.
- Tests start a fake program that prints a made-up stream. No test starts a real agent program.
