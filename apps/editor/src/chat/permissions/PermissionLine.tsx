import type { PermissionEntry } from "./permissionSchemas.js";
import { answeredTextOf } from "./permissionTexts.js";
import "./permissions.css";

export function PermissionLine(props: { entry: PermissionEntry }) {
  const { entry } = props;
  return (
    <li className="entry permission-line" data-state={entry.state}>
      <p>{answeredTextOf(entry)}</p>
      <p className="permission-line-detail">{entry.detail}</p>
    </li>
  );
}
