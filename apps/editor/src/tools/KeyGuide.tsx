import { useRef, useState, type SubmitEvent } from "react";
import type { MediaKey } from "./mediaServers.js";
import { failureTextOf, type KeyRequests } from "./requestText.js";

type SaveState =
  { kind: "idle" } | { kind: "saving" } | { kind: "failed"; message: string };

function siteOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "the key page";
  }
}

export function KeyGuide(props: {
  serverId: string;
  mediaKey: MediaKey;
  requests: KeyRequests;
}) {
  const { mediaKey, requests } = props;
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const inputId = `key-${props.serverId}-${mediaKey.variable}`;

  const save = (event: SubmitEvent) => {
    event.preventDefault();
    const field = input.current;
    if (field === null || field.value === "") return;
    const saving = requests.saveKey({
      variable: mediaKey.variable,
      value: field.value,
    });
    field.value = "";
    setState({ kind: "saving" });
    saving.then(
      (saved) => {
        setState(
          saved.ok
            ? { kind: "idle" }
            : { kind: "failed", message: failureTextOf(saved.failure) },
        );
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  };

  return (
    <div className="key-guide">
      <ol className="key-steps">
        {mediaKey.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <a
        className="button-link"
        href={mediaKey.get_key_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open {siteOf(mediaKey.get_key_url)}
      </a>
      <form className="key-form" onSubmit={save}>
        <label htmlFor={inputId}>{mediaKey.label}</label>
        <input
          ref={input}
          type="password"
          id={inputId}
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste the key"
          required
        />
        <button
          type="submit"
          className="primary"
          disabled={state.kind === "saving"}
        >
          {state.kind === "saving" ? "Saving the key" : "Save the key"}
        </button>
      </form>
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
      <p className="fact">
        The key stays in one file on this computer. The agent never sees it.
      </p>
    </div>
  );
}
