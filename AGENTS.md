# Instructions for agents

These rules apply to each agent that works in this repository.

## Before you write code

1. Read `docs/design/README.md` and the design documents that cover your task.
2. The design decides interfaces, names, file formats, and package boundaries. If the design is wrong or has a gap, stop and report it. Do not choose a different design yourself.
3. Check each library version and interface in its current documents. Do not use memory for a version or an interface.

## Code rules

- Strict TypeScript. No `any`, no non-null `!`, and no `as` cast. `as const` is permitted.
- A function with two or more arguments takes one options object.
- Use full words for names: `statement`, not `stmt`. Abbreviate only what the code base already abbreviates, such as `id` and `url`.
- Keep each file under 200 lines, tests included. Plan a folder with an `index.ts` before a file grows past the limit.
- Write no comments. Use a clear name, a named function, a type, or a test.
- Never disable a lint rule with `eslint-disable`.
- An expected failure is a return value with a `kind`. Throw a plain `Error` only for a defect.
- Never ignore a promise. Await it, or handle its failure.
- Put a file next to the code it belongs to. Name a folder for its meaning, not for the form of its files. Put each test next to the file it covers.
- A package uses another package only through its package name and its public interface.
- Follow the dependency table in `docs/design/01-architecture.md`.

## Dependencies

- Never add `gsap`, a HyperFrames package, or a Remotion package.
- A new dependency must have an MIT, BSD, ISC, Apache-2.0, or MPL-2.0 license. A font may use the SIL Open Font License. Ask the owner about any other license.
- Add a dependency only to the package that uses it.

## Tests

- Test through the public interface of a package.
- Each test names the behavior it protects, and fails without the code it covers.
- Get an expected value from an independent source, such as a formula or a value computed by hand.
- Replace a dependency only at an outside boundary: the network, a paid service, or another program.
- No test and no CI job calls a paid service.

## Use what you build

Before you open a pull request, use your change in the way a user would. Follow the dogfood rules in `docs/design/07-build-plan-m1.md`: free sample media, small renders, a look at the real result, and evidence in the pull request.

## Text

- Write short sentences in the active voice. Put one idea in each sentence.
- Use the same word for the same thing. The word list is in `docs/design/README.md`.
- Never use an em dash or an en dash. Use a comma, a period, or parentheses. Write "2 to 5" for a range.
- Do not use words such as robust, seamless, or leverage.

## Git and pull requests

1. Run `git status` before `git add` and before `git commit`.
2. Work on a branch. Never commit to `main`.
3. Write each commit message as one line: `type(scope): subject`. Add no body, no trailer, and no attribution.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before each push.
5. Open one pull request for one change. Use the pull request template. Add no attribution line.
6. Use a pull request title in the same format as a commit message. The title becomes the commit on `main`.
7. Watch CI after each push until it is green. A red check on your pull request is your job.
8. Each pull request merges as one squash commit. The repository permits no other merge method.
9. Never commit a secret, an API key, or a file from outside the repository.
