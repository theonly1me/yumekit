import { describe, expect, it } from "vitest";
import { bundledPackagesOf, publishManifestOf } from "./publishManifest.ts";
import { manifestOf } from "./workspaceManifests.ts";

const root = {
  version: "0.1.0",
  description: "A harness.",
  license: "Apache-2.0",
  engines: { node: ">=22" },
};

function workspacePackage(options: {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}) {
  return manifestOf({
    folder: options.name.replace("@yumekit/", "packages/"),
    json: options,
  });
}

const cli = workspacePackage({
  name: "@yumekit/cli",
  dependencies: { "@yumekit/render": "workspace:*", zod: "4.6.7" },
});
const editor = workspacePackage({
  name: "@yumekit/editor",
  dependencies: { react: "19.0.0" },
});

function manifestWith(render: ReturnType<typeof workspacePackage>) {
  const codePackages = bundledPackagesOf({
    manifests: [cli, render, editor],
    entryNames: ["@yumekit/cli"],
  });
  if (!codePackages.ok) throw new Error(codePackages.problems.join("\n"));
  return publishManifestOf({ root, codePackages: codePackages.value });
}

describe("the publish manifest", () => {
  it("lists each outside dependency of the code with its exact version, and no workspace package", () => {
    const manifest = manifestWith(
      workspacePackage({
        name: "@yumekit/render",
        dependencies: { react: "19.3.1", zod: "4.6.7" },
        peerDependencies: { react: "^19.3.1" },
      }),
    );

    expect(manifest).toMatchObject({
      ok: true,
      value: {
        name: "yumekit",
        version: "0.1.0",
        dependencies: {
          react: "19.3.1",
          zod: "4.6.7",
        },
        bin: { yumekit: "lib/node_modules/@yumekit/cli/dist/main.js" },
        files: ["lib", "README.md", "LICENSE"],
      },
    });
    expect(manifest.ok && manifest.value.dependencies).toEqual({
      react: "19.3.1",
      zod: "4.6.7",
    });
  });

  it("fails when two workspace packages need different versions", () => {
    const manifest = manifestWith(
      workspacePackage({
        name: "@yumekit/render",
        dependencies: { zod: "4.6.8" },
      }),
    );

    expect(manifest.ok).toBe(false);
    expect(JSON.stringify(manifest)).toContain(
      "packages/render needs zod 4.6.8, but packages/cli needs 4.6.7.",
    );
  });

  it("fails for a version range and for a peer that nothing provides", () => {
    const manifest = manifestWith(
      workspacePackage({
        name: "@yumekit/render",
        dependencies: { vite: "^8.3.8" },
        peerDependencies: { "react-dom": "^19.3.1" },
      }),
    );

    expect(manifest).toEqual({
      ok: false,
      problems: [
        "packages/render needs vite ^8.3.8, which is not an exact version.",
        "packages/render has the peer react-dom, which no bundled package depends on.",
      ],
    });
  });

  it("fails when a workspace dependency has no package", () => {
    expect(
      bundledPackagesOf({ manifests: [cli], entryNames: ["@yumekit/cli"] }),
    ).toEqual({
      ok: false,
      problems: ["No workspace package has the name @yumekit/render."],
    });
  });
});
