import type { ProjectState } from "../format/state.js";
import { succeed } from "../outcome.js";
import { inCatalogOrder } from "../platforms/catalog.js";
import type { EditOfKind } from "./edit.js";
import { problem, type EditResult } from "./editFailure.js";

export function setOutputPlatforms(options: {
  state: ProjectState;
  edit: EditOfKind<"setOutputPlatforms">;
}): EditResult {
  const { state, edit } = options;
  if (!state.project.outputs.some((output) => output.id === edit.outputId)) {
    return problem({
      kind: "not-found",
      message: `The output "${edit.outputId}" does not exist.`,
    });
  }
  const platforms = inCatalogOrder(edit.platforms);
  return succeed({
    ...state,
    project: {
      ...state.project,
      outputs: state.project.outputs.map((output) =>
        output.id === edit.outputId
          ? {
              id: output.id,
              label: output.label,
              widthPixels: output.widthPixels,
              heightPixels: output.heightPixels,
              ...(platforms.length === 0 ? {} : { platforms }),
            }
          : output,
      ),
    },
  });
}
