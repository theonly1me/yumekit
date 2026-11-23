import { useState, type CSSProperties } from "react";
import type { Output } from "../../engine/snapshot.js";
import { platformTabsOf } from "../../platforms/platformTabFacts.js";
import { MadeWith } from "../../settings/services/index.js";
import type { StepViewProps } from "../frame/stepViewProps.js";
import { PictureDetail } from "./PictureDetail.js";
import { PictureView } from "./PictureView.js";
import { usePictureCards } from "./usePictureCards.js";
import "./pictures.css";

function shapeStyleOf(output: Output): CSSProperties {
  return {
    aspectRatio: `${String(output.widthPixels)} / ${String(output.heightPixels)}`,
  };
}

function OutputChoice(props: {
  outputs: Output[];
  outputId: string;
  onChoose: (outputId: string) => void;
}) {
  const tabs = platformTabsOf(props.outputs);
  const choices = props.outputs.map((output) => {
    const ofOutput = tabs.filter((tab) => tab.output.id === output.id);
    const [first] = ofOutput;
    return {
      output,
      name: ofOutput.map((tab) => tab.name).join(", "),
      shape: first?.shape ?? "",
    };
  });
  return (
    <div className="segments" role="group" aria-label="Which version to show">
      {choices.map((choice) => (
        <button
          key={choice.output.id}
          type="button"
          aria-pressed={choice.output.id === props.outputId}
          onClick={() => {
            props.onChoose(choice.output.id);
          }}
        >
          {choice.name} <span>{choice.shape}</span>
        </button>
      ))}
    </div>
  );
}

function PictureGrid(props: StepViewProps & { output: Output }) {
  const { output } = props;
  const cards = usePictureCards(props);
  const [pickedKey, setPickedKey] = useState<string>();
  const picked = cards.find((card) => card.key === pickedKey);
  const shape = shapeStyleOf(output);
  if (cards.length === 0) {
    return (
      <p className="fact">
        No scene yet. A picture shows here when the AI makes a scene.
      </p>
    );
  }
  return (
    <>
      <ul
        className="picture-grid"
        data-tall={String(output.heightPixels > output.widthPixels)}
        aria-label="Scenes"
      >
        {cards.map((card) => (
          <li key={card.key}>
            <button
              type="button"
              className="picture-card"
              aria-pressed={card.key === pickedKey}
              onClick={() => {
                setPickedKey(card.key === pickedKey ? undefined : card.key);
              }}
            >
              <PictureView picture={card.picture} shape={shape} />
              <span>
                {card.number}. {card.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {picked === undefined ? (
        <p className="fact">
          Click a picture to see it large and to change it.
        </p>
      ) : (
        <PictureDetail {...props} key={picked.key} card={picked} />
      )}
    </>
  );
}

export function PicturesView(props: StepViewProps) {
  const { outputs } = props.snapshot.project;
  const [outputId, setOutputId] = useState<string>();
  const [first] = outputs;
  const output =
    outputs.find((candidate) => candidate.id === outputId) ?? first;
  if (output === undefined) {
    return <p className="fact">This project has no video shape yet.</p>;
  }
  return (
    <>
      <MadeWith client={props.client} kind="image" />
      {outputs.length > 1 ? (
        <OutputChoice
          outputs={outputs}
          outputId={output.id}
          onChoose={setOutputId}
        />
      ) : undefined}
      <PictureGrid {...props} key={output.id} output={output} />
    </>
  );
}
