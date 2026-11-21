import type { ReactNode } from "react";
import { pathKey, type PropPath } from "./propPath.js";

function issueIdOf(path: PropPath): string {
  return `issue-${pathKey(path)}`;
}

export function controlStateOf(options: {
  path: PropPath;
  issue: string | undefined;
}) {
  return options.issue === undefined
    ? {}
    : {
        "aria-invalid": true,
        "aria-describedby": issueIdOf(options.path),
      };
}

export function IssueLine(props: {
  path: PropPath;
  issue: string | undefined;
  label?: string;
}) {
  if (props.issue === undefined) return undefined;
  return (
    <p className="field-issue" id={issueIdOf(props.path)} role="alert">
      {props.label === undefined
        ? props.issue
        : `${props.label}: ${props.issue}`}
    </p>
  );
}

export function FieldFrame(props: {
  controlId: string;
  path: PropPath;
  label: string;
  issue: string | undefined;
  isIssueBelowRow: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={props.controlId}>{props.label}</label>
      {props.children}
      {props.isIssueBelowRow === true ? undefined : (
        <IssueLine path={props.path} issue={props.issue} />
      )}
    </div>
  );
}
