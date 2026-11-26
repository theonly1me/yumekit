import type { Snapshot } from "../../../engine/snapshot.js";
import {
  scriptParagraphsOf,
  storyParagraphsOf,
} from "../../story/storyParagraphs.js";

export function StoryText(props: { snapshot: Snapshot }) {
  const { story } = props.snapshot.bible;
  if (story === undefined) {
    return (
      <p className="fact lead">The story shows here when the lead writes it.</p>
    );
  }
  const paragraphs = [
    ...storyParagraphsOf(story),
    ...scriptParagraphsOf(props.snapshot.script),
  ];
  return (
    <div className="row-story" tabIndex={0} aria-label="The story">
      {paragraphs.map((paragraph) => (
        <div key={paragraph.key}>
          {paragraph.label === "" ? undefined : (
            <h5 className="story-label">{paragraph.label}</h5>
          )}
          <p>{paragraph.text}</p>
        </div>
      ))}
    </div>
  );
}
