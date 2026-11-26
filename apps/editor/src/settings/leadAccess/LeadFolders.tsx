import { useId, useState, type SubmitEvent } from "react";
import { shownPathOf, type LeadAccess } from "./leadAccessRequests.js";
import type { LeadAccessActions } from "./useLeadAccess.js";

function nameOf(folder: string): string {
  return folder.split(/[\\/]/).filter(Boolean).at(-1) ?? folder;
}

export function LeadFolders(props: {
  lead: LeadAccess;
  actions: LeadAccessActions;
}) {
  const { lead, actions } = props;
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const [failure, setFailure] = useState<string>();
  const [isSaving, setSaving] = useState(false);
  const change = (options: {
    send: () => Promise<string | undefined>;
    clears: boolean;
  }) => {
    setSaving(true);
    options
      .send()
      .then(
        (message) => {
          setFailure(message);
          if (message === undefined && options.clears) setTyped("");
        },
        (error: unknown) => {
          setFailure(String(error));
        },
      )
      .finally(() => {
        setSaving(false);
      })
      .catch(() => undefined);
  };
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (typed.trim() === "") return;
    change({ send: () => actions.addFolder(typed), clears: true });
  };
  return (
    <div className="lead-folders">
      <h4>Folders the lead may read</h4>
      <p className="fact">
        The lead reads this project without asking. It reads these folders
        without asking too. For any other file on this computer, it asks you
        first.
      </p>
      {lead.folders.length === 0 ? (
        <p className="lead-empty">No folders yet.</p>
      ) : (
        <ul className="setting-rows" aria-label="Folders the lead may read">
          {lead.folders.map((folder) => (
            <li key={folder} className="setting-row lead-folder">
              <span className="lead-path" title={folder}>
                {shownPathOf({ path: folder, home: lead.home })}
              </span>
              <button
                type="button"
                aria-label={`Remove ${shownPathOf({ path: folder, home: lead.home })}`}
                disabled={isSaving}
                onClick={() => {
                  change({
                    send: () => actions.removeFolder(folder),
                    clears: false,
                  });
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="lead-add" onSubmit={submit}>
        <label htmlFor={inputId}>Add a folder</label>
        <div className="lead-add-row">
          <input
            id={inputId}
            type="text"
            spellCheck={false}
            autoComplete="off"
            placeholder="~/Movies"
            value={typed}
            onChange={(event) => {
              setTyped(event.currentTarget.value);
            }}
          />
          <button type="submit" disabled={isSaving || typed.trim() === ""}>
            Add
          </button>
        </div>
      </form>
      {lead.suggestions.length === 0 ? undefined : (
        <div
          className="lead-suggestions"
          role="group"
          aria-label="Pick a folder"
        >
          <span>Or pick one</span>
          {lead.suggestions.map((folder) => (
            <button
              key={folder}
              type="button"
              className="option-chip"
              title={folder}
              disabled={isSaving}
              onClick={() => {
                change({
                  send: () => actions.addFolder(folder),
                  clears: false,
                });
              }}
            >
              {nameOf(folder)}
            </button>
          ))}
        </div>
      )}
      {lead.note === undefined ? undefined : (
        <p className="fact">{lead.note}</p>
      )}
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
