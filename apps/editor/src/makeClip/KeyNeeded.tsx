import { KeyGuide } from "../tools/KeyGuide.js";
import type { KeyRequests } from "../tools/requestText.js";
import type { ModelChoice } from "./modelChoices.js";
import { priceText, type Price } from "./price.js";

function costText(price: Price): string {
  if (price.kind === "free") return "Then this clip is free.";
  if (price.kind === "about") {
    return `Then this clip costs ${priceText(price).toLowerCase()}.`;
  }
  return "";
}

export function KeyNeeded(props: {
  choice: ModelChoice;
  price: Price;
  requests: KeyRequests;
}) {
  const { choice } = props;
  const { missingKey } = choice;
  return (
    <div className="clip-action">
      <p className="clip-price">{choice.serverLabel} needs a key</p>
      <p className="fact">
        Add it once. It takes about two minutes. {costText(props.price)}
      </p>
      {missingKey === undefined ? undefined : (
        <KeyGuide
          key={missingKey.variable}
          serverId={choice.server.server}
          mediaKey={missingKey}
          requests={props.requests}
          saveLabel="Save the key and continue"
        />
      )}
    </div>
  );
}
