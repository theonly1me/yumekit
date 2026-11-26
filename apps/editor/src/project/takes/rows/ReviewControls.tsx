import { draftVerdicts } from "@yumekit/project/takes";
import type { ShownKind } from "../itemFacts.js";
import {
  pickVerdict,
  toggleTag,
  verdictOfDraft,
  writeNote,
  type DraftChange,
  type ItemDraft,
} from "../review/itemDrafts.js";
import { itemTags, verdictNames } from "../review/itemTags.js";

export function VerdictButtons(props: {
  draft: ItemDraft;
  onChange: (next: DraftChange) => void;
}) {
  const verdict = verdictOfDraft(props.draft);
  return (
    <div className="verdicts" role="group" aria-label="Your verdict">
      {draftVerdicts.map((each) => (
        <button
          key={each}
          type="button"
          data-verdict={each}
          aria-pressed={verdict === each}
          onClick={() => {
            props.onChange(pickVerdict(each));
          }}
        >
          {verdictNames[each]}
        </button>
      ))}
    </div>
  );
}

export function TagChips(props: {
  kind: ShownKind;
  draft: ItemDraft;
  onChange: (next: DraftChange) => void;
}) {
  const tags = [...new Set([...itemTags[props.kind], ...props.draft.tags])];
  return (
    <div className="review-tags" role="group" aria-label="What is wrong">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="review-tag"
          aria-pressed={props.draft.tags.includes(tag)}
          onClick={() => {
            props.onChange(toggleTag(tag));
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export function NoteBox(props: {
  draft: ItemDraft;
  onChange: (next: DraftChange) => void;
}) {
  return (
    <textarea
      className="review-note"
      value={props.draft.note}
      rows={2}
      placeholder="What is wrong, or what is good, in your words"
      aria-label="Your note"
      onChange={(event) => {
        props.onChange(writeNote(event.target.value));
      }}
    />
  );
}
