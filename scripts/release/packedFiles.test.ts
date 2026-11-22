import { describe, expect, it } from "vitest";
import { contentProblemsOf, pathProblemsOf } from "./packedFiles.ts";

const bundledNames = ["@yumekit/cli"];

describe("the packed file check", () => {
  it("accepts the manifest, the README, the license, and the built code of a bundled package", () => {
    expect(
      pathProblemsOf({
        bundledNames,
        paths: [
          "package/package.json",
          "package/README.md",
          "package/LICENSE",
          "package/lib/node_modules/@yumekit/cli/dist/main.js",
          "package/lib/node_modules/@yumekit/cli/dist/main.d.ts",
        ],
      }),
    ).toEqual([]);
  });

  it("rejects a test, a source map, an .env file, source code, and a file outside the files list", () => {
    expect(
      pathProblemsOf({
        bundledNames,
        paths: [
          "package/lib/node_modules/@yumekit/cli/dist/main.test.js",
          "package/lib/node_modules/@yumekit/cli/dist/main.js.map",
          "package/lib/node_modules/@yumekit/cli/.env",
          "package/lib/node_modules/@yumekit/cli/src/main.ts",
          "package/docs/design/README.md",
        ],
      }),
    ).toEqual([
      "package/lib/node_modules/@yumekit/cli/dist/main.test.js is a test file.",
      "package/lib/node_modules/@yumekit/cli/dist/main.js.map is a source map.",
      "package/lib/node_modules/@yumekit/cli/.env is an .env file.",
      "package/lib/node_modules/@yumekit/cli/src/main.ts is repository source.",
      "package/lib/node_modules/@yumekit/cli/src/main.ts is TypeScript source.",
      "package/docs/design/README.md is outside the files list.",
      "package/docs/design/README.md is a design file.",
    ]);
  });

  it("rejects an install script and a value in the form of a key", () => {
    expect(
      contentProblemsOf({
        path: "package/package.json",
        text: JSON.stringify({
          scripts: { postinstall: "node fetch.js" },
          note: `sk-${"a".repeat(40)}`,
        }),
      }),
    ).toEqual([
      "package/package.json holds a value in the form of a key.",
      "package/package.json has the script postinstall.",
    ]);
  });
});
