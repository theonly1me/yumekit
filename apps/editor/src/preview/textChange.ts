import type { Snapshot } from "../engine/snapshot.js";
import {
  isJsonObject,
  valueAt,
  withValueAt,
  type JsonObject,
  type JsonValue,
  type PropPath,
} from "../scenePanel/form/propPath.js";

export interface TextChange {
  sceneId: string;
  path: PropPath;
  text: string;
}

export interface TextChangeCall {
  input: object;
  component: string | undefined;
  props: JsonObject;
}

function canHoldText(options: { props: JsonValue; path: PropPath }): boolean {
  const { props, path } = options;
  const isEachParentFitting = path.every((...[segment, index]) => {
    const parent = valueAt({ value: props, path: path.slice(0, index) });
    if (parent === undefined) return true;
    if (typeof segment === "number") return Array.isArray(parent);
    return isJsonObject(parent);
  });
  const current = valueAt({ value: props, path });
  return (
    isEachParentFitting &&
    (current === undefined || typeof current === "string")
  );
}

export function textChangeCallOf(options: {
  snapshot: Snapshot;
  change: TextChange;
  savedProps: JsonObject | undefined;
}): TextChangeCall | undefined {
  const { snapshot, change } = options;
  const scene = snapshot.scenes.find(
    (candidate) => candidate.id === change.sceneId,
  );
  if (scene === undefined) return undefined;
  const props = options.savedProps ?? scene.source.props;
  if (change.path.length === 0 || !canHoldText({ props, path: change.path })) {
    return undefined;
  }
  const changed = withValueAt({
    value: props,
    path: change.path,
    next: change.text,
  });
  if (!isJsonObject(changed)) return undefined;
  const common = {
    scene_id: scene.id,
    title: scene.title,
    notes: scene.notes,
    props: changed,
  };
  if (scene.source.kind === "kit") {
    return {
      input: { ...common, kit_component: scene.source.component },
      component: scene.source.component,
      props: changed,
    };
  }
  const code = snapshot.sceneCode[scene.id];
  return code === undefined
    ? undefined
    : { input: { ...common, code }, component: undefined, props: changed };
}
