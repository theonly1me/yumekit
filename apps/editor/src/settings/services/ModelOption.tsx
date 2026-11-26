import type { ChoiceModel, ModelTarget } from "./mediaChoices.js";
import { modelPriceText } from "./modelPriceText.js";

export function ModelOption(props: {
  target: ModelTarget;
  model: ChoiceModel | undefined;
  isPicked: boolean;
  isSaving: boolean;
  onChoose: () => void;
}) {
  const { model } = props;
  return (
    <button
      type="button"
      className="model-option"
      aria-pressed={props.isPicked}
      disabled={props.isSaving}
      onClick={props.onChoose}
    >
      <span className="model-option-name">
        {props.target.modelLabel ?? "The model of this service"}
      </span>
      {model === undefined ? undefined : (
        <span className="model-option-facts">
          <span>
            {modelPriceText({
              price: model.price_at_defaults,
              resolution: model.default_resolution,
            })}
          </span>
          {model.tested === false ? (
            <em>Not tested with yumekit yet</em>
          ) : undefined}
        </span>
      )}
    </button>
  );
}
