import { useCallback, useMemo } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { Asset, Scene } from "../../engine/snapshot.js";
import { fieldsOf } from "./fields.js";
import { FieldView } from "./FieldView.js";
import type { FormBinding } from "./formBinding.js";
import { routeIssues } from "./issueRoutes.js";
import type { PropSchema } from "./propSchema.js";
import { pathKey, valueAt } from "./propPath.js";
import { plainIssue } from "./plainMessages.js";
import { useSceneDraft, type IssueWording } from "./useSceneDraft.js";

export function KitForm(props: {
  client: EngineClient;
  scene: Scene;
  component: string;
  schema: PropSchema;
  assets: Asset[];
  revision: number;
}) {
  const { client, scene, component, schema, assets, revision } = props;
  const fields = useMemo(() => fieldsOf(schema), [schema]);
  const wordIssues = useCallback<IssueWording>(
    (wording) =>
      wording.issues.map((issue) =>
        plainIssue({ issue, schema, props: wording.props }),
      ),
    [schema],
  );
  const draft = useSceneDraft({
    client,
    scene,
    component,
    wordIssues,
    revision,
  });
  const issues = useMemo(
    () =>
      routeIssues({
        issues: draft.failure.kind === "rejected" ? draft.failure.issues : [],
        fields,
        draft: draft.draft,
      }),
    [draft.failure, fields, draft.draft],
  );
  const form: FormBinding = {
    valueAt: (path) => valueAt({ value: draft.draft, path }),
    issueAt: (path) => issues.byField.get(pathKey(path)),
    change: draft.change,
    flush: draft.flush,
    assets,
  };
  const generalFailure =
    draft.failure.kind !== "rejected"
      ? undefined
      : draft.failure.issues.length === 0
        ? [draft.failure.message, draft.failure.hint].join(" ").trim()
        : issues.unplaced.length === 0
          ? undefined
          : issues.unplaced.join(" ");
  return (
    <form
      className="kit-form"
      aria-label="Fields of this scene"
      onSubmit={(event) => {
        event.preventDefault();
        draft.flush();
      }}
    >
      {fields.map((field) => (
        <FieldView
          key={field.name}
          field={field}
          path={[field.name]}
          form={form}
        />
      ))}
      {generalFailure === undefined ? undefined : (
        <p className="field-issue" role="alert">
          {generalFailure}
        </p>
      )}
    </form>
  );
}
