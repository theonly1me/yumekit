import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { checkModuleCode, checkSharedModuleCode } from "../story/checkScene.js";

const putSharedCodeInput = {
  name: idInput(
    "The name of the shared module. A scene imports it as ./_shared/<name>. An existing module with this name is replaced.",
  ),
  code: z
    .string()
    .min(1)
    .describe(
      "The TSX code of the module, with named exports, for example a theme, a font family name, a layout helper, or a small component. It may import react, @yumekit/scene, @yumekit/scene-kit, @yumekit/scene-kit/motion, and other shared modules as ./<name>. The rules of scene code apply: no clock, no random, no network.",
    ),
};

function importsModule(options: { code: string; name: string }): boolean {
  return (
    options.code.includes(`"./_shared/${options.name}"`) ||
    options.code.includes(`'./_shared/${options.name}'`)
  );
}

async function putSharedCode(options: {
  context: HarnessContext;
  name: string;
  code: string;
}): Promise<CallToolResult> {
  const { context, name, code } = options;
  const snapshot = context.store.read();
  const own = await checkSharedModuleCode({
    name,
    code,
    sharedCode: snapshot.sharedCode,
  });
  if (own !== undefined) return failureResult(own);
  const sharedCode = { ...snapshot.sharedCode, [name]: code };
  const users = Object.entries(snapshot.sceneCode).filter(([, sceneCode]) =>
    importsModule({ code: sceneCode, name }),
  );
  for (const [sceneId, sceneCode] of users) {
    const failure = await checkModuleCode({
      sceneId,
      code: sceneCode,
      sharedCode,
    });
    if (failure !== undefined) {
      return failureResult({
        ...failure,
        message: `The new shared code "${name}" breaks scene "${sceneId}": ${failure.message}`,
        hint: `Keep each export that scene "${sceneId}" uses, or change the scene first with put_scene. ${failure.hint}`,
      });
    }
  }
  return applyEditsResult({
    store: context.store,
    edits: [{ kind: "putSharedCode", name, code }],
    line: `Shared code "${name}" saved. A scene imports it as ./_shared/${name}.${users.length === 0 ? "" : ` ${String(users.length)} scenes use it.`}`,
    data: {
      name,
      import_as: `./_shared/${name}`,
      scene_ids: users.map(([sceneId]) => sceneId),
    },
  });
}

export function registerPutSharedCode(context: HarnessContext): void {
  context.tools.add({
    name: "put_shared_code",
    description:
      "Write one module of code that each custom scene of the project can import as ./_shared/<name>: a theme, a layout helper, or a component that two or more scenes share. Write it once here, not once in each scene. It gets the same check as scene code, and each scene that imports it is checked again. A font file goes in set_fonts, not here. One undo removes the change.",
    inputSchema: putSharedCodeInput,
    run: ({ input }) => putSharedCode({ context, ...input }),
  });
}
