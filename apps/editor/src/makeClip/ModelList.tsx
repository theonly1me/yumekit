import { groupsOf, type ModelChoice } from "./modelChoices.js";
import { priceText, type Price } from "./price.js";

export function ModelList(props: {
  choices: ModelChoice[];
  chosenKey: string | undefined;
  onChoose: (key: string) => void;
  priceFor: (choice: ModelChoice) => Price;
}) {
  if (props.choices.length === 0) {
    return (
      <p className="fact">
        No connected tool makes video. Add one in{" "}
        <strong>media-tools.json</strong>.
      </p>
    );
  }
  return (
    <fieldset className="models">
      <legend>Model</legend>
      {groupsOf(props.choices).map((group) => (
        <div key={group.server} className="model-group">
          <p className="model-server">{group.label}</p>
          {group.choices.map((choice) => (
            <label
              key={choice.key}
              className="model"
              data-ready={choice.isReady}
            >
              <input
                type="radio"
                name="model"
                value={choice.key}
                checked={choice.key === props.chosenKey}
                onChange={() => {
                  props.onChoose(choice.key);
                }}
              />
              <span className="model-name">{choice.model.label}</span>
              <span className="model-price">
                {priceText(props.priceFor(choice))}
                {choice.isReady ? undefined : <em>Needs a key</em>}
              </span>
            </label>
          ))}
        </div>
      ))}
    </fieldset>
  );
}
