import { useState } from "react";
import type { LeadAccess } from "./leadAccessRequests.js";
import type { LeadAccessActions } from "./useLeadAccess.js";

export function LeadRules(props: {
  lead: LeadAccess;
  actions: LeadAccessActions;
}) {
  const { lead, actions } = props;
  const [failure, setFailure] = useState<string>();
  if (lead.rules.length === 0) return null;
  return (
    <div className="lead-rules">
      <h4>Allowed for this project</h4>
      <p className="fact">
        You picked Allow for this project on these cards. The lead does them
        without asking.
      </p>
      <ul className="setting-rows" aria-label="Allowed for this project">
        {lead.rules.map(({ rule, text }) => (
          <li key={rule} className="setting-row lead-folder">
            <span className="lead-rule">{text}</span>
            <button
              type="button"
              aria-label={`Remove: ${text}`}
              onClick={() => {
                actions.removeRule(rule).then(setFailure, (error: unknown) => {
                  setFailure(String(error));
                });
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
