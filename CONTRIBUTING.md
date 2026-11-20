# Contributing to yumekit

yumekit is in early development. Small and focused changes are easiest to review.

## Before you open a pull request

1. Open an issue for a large change. Describe the problem first.
2. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. All checks must pass.
3. Add a test for each behavior that you add or change.

## Design first

Read `docs/design/README.md` before a change. `AGENTS.md` has the full rules for code, tests, and pull requests.

## Code rules

- Use strict TypeScript. Do not use `any`, the non-null `!`, or `as` casts. `as const` is permitted.
- A function with two or more arguments takes one options object.
- Use full words for names.
- Keep each file under 200 lines, tests included.
- Do not write comments. Use clear names and tests.
- Do not disable a lint rule with `eslint-disable`.
- A package uses only the public interface of another package.

## Commit messages

Write one line in the format `type(scope): subject`. For example: `feat(project): add applyEdit`.

## License

By contributing, you agree that your contribution uses the Apache License 2.0.
