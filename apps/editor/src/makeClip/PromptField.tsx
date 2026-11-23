export function PromptField(props: {
  prompt: string;
  onPrompt: (prompt: string) => void;
  onAskTheAi: () => void;
}) {
  return (
    <div className="field prompt-field">
      <div className="prompt-label-row">
        <label htmlFor="clip-prompt">What happens in the clip</label>
        <button type="button" className="link" onClick={props.onAskTheAi}>
          Let the AI write it
        </button>
      </div>
      <textarea
        id="clip-prompt"
        rows={3}
        value={props.prompt}
        placeholder="A street basketball player jumps for a dunk. Golden hour."
        onChange={(change) => {
          props.onPrompt(change.target.value);
        }}
      />
    </div>
  );
}
