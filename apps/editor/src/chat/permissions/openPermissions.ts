import type { ChatEntry } from "../chatSchemas.js";
import type { PermissionEntry } from "./permissionSchemas.js";

export function openPermissionsOf(entries: ChatEntry[]): PermissionEntry[] {
  return entries.filter(
    (entry): entry is PermissionEntry =>
      entry.kind === "permission" && entry.state === "open",
  );
}
