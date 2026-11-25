import { Fragment } from "react";
import type { Snapshot } from "../../engine/snapshot.js";
import type { WholeStory as Story } from "./wholeStorySchema.js";
import "./wholeStory.css";

const approvalTexts = {
  waiting:
    "The AI asks you to say yes to this story, or what to change, before it spends money.",
  "person-said-yes": "You said yes to this story.",
  "request-said-go-ahead":
    "Your request said to go ahead, so the AI did not ask about the story first.",
} as const;

function Person(props: {
  name: string;
  role?: string;
  background: string;
  rows: [string, string][];
  sheetName: string | undefined;
}) {
  return (
    <li className="story-person">
      <span className="file-name">
        {props.name}
        {props.role === undefined ? null : (
          <span className="story-role"> · {props.role}</span>
        )}
      </span>
      <span className="story-background">{props.background}</span>
      <dl className="story-arc">
        {props.rows.map(([label, text]) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{text}</dd>
          </Fragment>
        ))}
      </dl>
      {props.sheetName === undefined ? null : (
        <span className="fact">Drawn from the sheet of {props.sheetName}</span>
      )}
    </li>
  );
}

export function WholeStory(props: { story: Story; snapshot: Snapshot }) {
  const { story } = props;
  const sheetNameOf = (characterId: string) =>
    props.snapshot.bible.cast.find(
      (member) => member.storyCharacterId === characterId,
    )?.name;
  const force = story.opposingForce;
  return (
    <section className="whole-story" aria-labelledby="whole-story-title">
      <h4 id="whole-story-title">The whole story</h4>
      <p className="story-premise">{story.premise}</p>
      <p className="story-approval" data-approval={story.approval ?? "waiting"}>
        {approvalTexts[story.approval ?? "waiting"]}
      </p>
      <dl className="story-arc">
        <dt>The world</dt>
        <dd>{story.world}</dd>
        <dt>Its rule</dt>
        <dd>{story.worldRule}</dd>
      </dl>
      <ul className="story-people" aria-label="The characters">
        {story.characters.map((character) => (
          <Person
            key={character.id}
            name={character.name}
            background={character.background}
            rows={[
              ["Wants", character.want],
              ["Fears", character.fear],
              ["Does not know", character.doesNotKnow],
            ]}
            sheetName={sheetNameOf(character.id)}
          />
        ))}
        <Person
          name={force.name}
          role="stands against them"
          background={force.what}
          rows={[["Why", force.why]]}
          sheetName={sheetNameOf(force.id)}
        />
      </ul>
      <ol className="story-steps" aria-label="The arc of the story">
        {story.arc.map((step) => (
          <li key={step.id}>{step.text}</li>
        ))}
      </ol>
      <p className="fact">What stays unknown: {story.unknownAtEnd}</p>
    </section>
  );
}
