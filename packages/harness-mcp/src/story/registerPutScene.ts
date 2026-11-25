import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { JsonObject, Scene } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput, jsonObjectInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { withCardLines } from "../storyFirst/withCardLines.js";
import { checkKitMarks } from "./checkKitMarks.js";
import { checkKitProps, checkModuleCode } from "./checkScene.js";

const putSceneInput = {
  scene_id: idInput(
    "The id of the scene. An existing scene with this id is replaced.",
  ),
  title: z.string().describe("A short title for a person."),
  notes: z
    .string()
    .optional()
    .describe("Optional notes: what the scene says and why."),
  kit_component: z
    .string()
    .optional()
    .describe(
      "The name of a kit scene from list_kit_scenes, for example 'title-card'. Give kit_component or code, not both.",
    ),
  code: z
    .string()
    .optional()
    .describe(
      "The TSX code of a custom scene. Call get_scene_guide first. Code that two or more scenes share goes in put_shared_code, and a scene imports it as ./_shared/<name>. Give kit_component or code, not both.",
    ),
  props: jsonObjectInput
    .optional()
    .describe(
      "The props of the scene as a JSON object. For a kit scene, use the exact prop names of its schema from list_kit_scenes, for example assetId in image-pan. Default {}.",
    ),
};

type PutSceneInput = z.infer<z.ZodObject<typeof putSceneInput>>;

async function putScene(options: {
  context: HarnessContext;
  input: PutSceneInput;
}): Promise<CallToolResult> {
  const { context, input } = options;
  const props: JsonObject = input.props ?? {};
  const common = {
    id: input.scene_id,
    title: input.title,
    notes: input.notes ?? "",
  };
  if (input.kit_component !== undefined && input.code === undefined) {
    const failure =
      checkKitProps({ component: input.kit_component, props }) ??
      checkKitMarks({
        component: input.kit_component,
        props,
        assets: context.store.read().assets,
      });
    if (failure) return failureResult(failure);
    const scene: Scene = {
      ...common,
      source: { kind: "kit", component: input.kit_component, props },
    };
    return withCardLines({
      result: applyEditsResult({
        store: context.store,
        edits: [{ kind: "putScene", scene }],
        line: `Kit scene "${input.scene_id}" (${input.kit_component}) saved.`,
        data: { scene_id: input.scene_id },
      }),
      read: () => context.store.read(),
      sceneIds: [input.scene_id],
    });
  }
  if (input.code !== undefined && input.kit_component === undefined) {
    const failure = await checkModuleCode({
      sceneId: input.scene_id,
      code: input.code,
      sharedCode: context.store.read().sharedCode,
    });
    if (failure) return failureResult(failure);
    const scene: Scene = { ...common, source: { kind: "module", props } };
    return applyEditsResult({
      store: context.store,
      edits: [{ kind: "putScene", scene, code: input.code }],
      line: `Custom scene "${input.scene_id}" saved.`,
      data: { scene_id: input.scene_id },
    });
  }
  return failureResult({
    kind: "scene-source-missing",
    message: "put_scene needs exactly one of kit_component and code.",
    hint: "For a ready scene, give kit_component (see list_kit_scenes) and props. For custom code, give code (see get_scene_guide) and props.",
  });
}

export function registerPutScene(context: HarnessContext): void {
  context.tools.add({
    name: "put_scene",
    description:
      "Add or replace a scene: a kit scene (kit_component and props) or a custom scene (code and props). The harness checks the props or compiles the code first and changes nothing when the check fails. A scene is not visible until a clip on a timeline shows it. For a new video, or for two or more scenes, use put_work: it writes the scenes with the shared code and the timeline in one call and one undo.",
    inputSchema: putSceneInput,
    run: ({ input }) => putScene({ context, input }),
  });
}
