import { checkSceneCode, type RenderFailure } from "@yumekit/render";
import { kitSceneSchemas } from "@yumekit/scene-kit/schemas";
import { prettifyError, type z } from "zod";
import type { FailureIssue, HarnessFailure } from "../results.js";

const permittedImports = "react, @yumekit/scene, and @yumekit/scene-kit";

function isKitComponent(name: string): name is keyof typeof kitSceneSchemas {
  return Object.keys(kitSceneSchemas).includes(name);
}

function propListOf(schema: z.ZodObject): string {
  const shape: Record<string, z.ZodType> = schema.shape;
  return Object.entries(shape)
    .map(([name, field]) => {
      const requirement = field.safeParse(undefined).success
        ? "optional"
        : "required";
      return `${name} (${requirement}): ${field.description ?? ""}`;
    })
    .join(" ");
}

function issuesOf(error: z.ZodError): FailureIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.filter(
      (key): key is string | number => typeof key !== "symbol",
    ),
    message: issue.message,
  }));
}

export function checkKitProps(options: {
  component: string;
  props: Record<string, unknown>;
}): HarnessFailure | undefined {
  const { component, props } = options;
  if (!isKitComponent(component)) {
    return {
      kind: "kit-scene-not-found",
      message: `The kit has no scene "${component}".`,
      hint: `Use one of: ${Object.keys(kitSceneSchemas).join(", ")}. Call list_kit_scenes for the purpose and the props of each.`,
    };
  }
  const schema = kitSceneSchemas[component].props;
  const parsed = schema.safeParse(props);
  if (parsed.success) return undefined;
  return {
    kind: "invalid-props",
    message: `The props do not match the kit scene "${component}": ${prettifyError(parsed.error)}`,
    hint: `Send only these props, with these names: ${propListOf(schema)}`,
    issues: issuesOf(parsed.error),
  };
}

function codeHint(failure: RenderFailure): string {
  switch (failure.kind) {
    case "scene-import-not-permitted":
      return `Remove the import of "${failure.importName}". A scene may import only ${permittedImports}. Call get_scene_guide for what each one gives.`;
    case "scene-compile-failed":
      return `Fix the code at line ${String(failure.line)}, column ${String(failure.column)}, then call put_scene again. The default export must come from defineReactScene. Call get_scene_guide for the contract and two complete examples.`;
    default:
      return (
        failure.hint ??
        "Call get_scene_guide, correct the code, and call put_scene again."
      );
  }
}

export async function checkModuleCode(options: {
  sceneId: string;
  code: string;
}): Promise<HarnessFailure | undefined> {
  const checked = await checkSceneCode(options);
  if (checked.ok) return undefined;
  return {
    kind: checked.failure.kind,
    message: checked.failure.message,
    hint: codeHint(checked.failure),
  };
}
