import type { ProjectSnapshot } from "@yumekit/project";
import type { FailureIssue, HarnessFailure } from "../results.js";
import {
  checkKitProps,
  checkModuleCode,
  checkSharedModuleCode,
} from "../story/checkScene.js";
import type { PutWorkInput, WorkScene } from "./putWorkInput.js";

type SharedCode = Readonly<Record<string, string>>;

interface PlacedFailure {
  path: (string | number)[];
  place: string;
  failure: HarnessFailure;
}

function importsAnyOf(options: { code: string; names: string[] }): boolean {
  return options.names.some(
    (name) =>
      options.code.includes(`"./_shared/${name}"`) ||
      options.code.includes(`'./_shared/${name}'`),
  );
}

async function sceneFailureOf(options: {
  scene: WorkScene;
  sharedCode: SharedCode;
}): Promise<HarnessFailure | undefined> {
  const { scene, sharedCode } = options;
  if (scene.kit_component !== undefined && scene.code === undefined) {
    return checkKitProps({
      component: scene.kit_component,
      props: scene.props ?? {},
    });
  }
  if (scene.code !== undefined && scene.kit_component === undefined) {
    return checkModuleCode({
      sceneId: scene.scene_id,
      code: scene.code,
      sharedCode,
    });
  }
  return {
    kind: "scene-source-missing",
    message: `Scene "${scene.scene_id}" needs exactly one of kit_component and code.`,
    hint: "Give kit_component and props for a kit scene, or code and props for a custom scene.",
  };
}

async function frameFailureOf(options: {
  name: string;
  sharedCode: SharedCode;
}): Promise<HarnessFailure | undefined> {
  const { name, sharedCode } = options;
  if (!(name in sharedCode)) {
    return {
      kind: "frame-not-found",
      message: `The frame names the shared code "${name}", which the project and this call do not have.`,
      hint: "Add the module to shared_code in the same call, or name a module of get_work.",
    };
  }
  const failure = await checkModuleCode({
    sceneId: `frame-${name}`,
    code: `import frame from "./_shared/${name}";\nexport default frame;\n`,
    sharedCode,
  });
  return failure === undefined
    ? undefined
    : {
        ...failure,
        hint: `The frame "${name}" needs a default export from defineReactScene, as a scene has. ${failure.hint}`,
      };
}

export async function checkWork(options: {
  input: PutWorkInput;
  snapshot: ProjectSnapshot;
}): Promise<{ sharedCode: SharedCode; failures: PlacedFailure[] }> {
  const { input, snapshot } = options;
  const newShared = input.shared_code ?? [];
  const sharedCode: SharedCode = {
    ...snapshot.sharedCode,
    ...Object.fromEntries(
      newShared.map((module) => [module.name, module.code]),
    ),
  };
  const scenes = input.scenes ?? [];
  const changedNames = newShared.map((module) => module.name);
  const keptScenes = Object.entries(snapshot.sceneCode).filter(
    ([sceneId, code]) =>
      !scenes.some((scene) => scene.scene_id === sceneId) &&
      importsAnyOf({ code, names: changedNames }),
  );
  const checks: Promise<PlacedFailure | undefined>[] = [
    ...[...newShared.entries()].map(async ([index, module]) => {
      const failure = await checkSharedModuleCode({ ...module, sharedCode });
      return (
        failure && {
          path: ["shared_code", index],
          place: `shared code "${module.name}"`,
          failure,
        }
      );
    }),
    ...[...scenes.entries()].map(async ([index, scene]) => {
      const failure = await sceneFailureOf({ scene, sharedCode });
      return (
        failure && {
          path: ["scenes", index],
          place: `scene "${scene.scene_id}"`,
          failure,
        }
      );
    }),
    ...keptScenes.map(async ([sceneId, code]) => {
      const failure = await checkModuleCode({ sceneId, code, sharedCode });
      return (
        failure && {
          path: ["shared_code"],
          place: `scene "${sceneId}", which this call does not change`,
          failure,
        }
      );
    }),
  ];
  if (typeof input.frame === "string") {
    const name = input.frame;
    checks.push(
      frameFailureOf({ name, sharedCode }).then(
        (failure) =>
          failure && { path: ["frame"], place: `frame "${name}"`, failure },
      ),
    );
  }
  const results = await Promise.all(checks);
  return {
    sharedCode,
    failures: results.filter((result) => result !== undefined),
  };
}

export function workFailureOf(failures: PlacedFailure[]): HarnessFailure {
  const [first] = failures;
  const issues: FailureIssue[] = failures.map(({ path, place, failure }) => ({
    path,
    message: `${place}: ${failure.kind}: ${failure.message} Hint: ${failure.hint}`,
  }));
  return {
    kind: "work-not-valid",
    message: `put_work changed nothing. ${String(failures.length)} parts failed their check. The first: ${first?.place ?? ""}: ${first?.failure.message ?? ""}`,
    hint: "Correct each part that issues names, then send the whole call again. Nothing of this call is saved.",
    issues,
  };
}
