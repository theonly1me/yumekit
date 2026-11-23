import { useState } from "react";
import type { Output } from "../../engine/snapshot.js";
import { sendFixedRequest, type FixedRequest } from "../fixedRequests.js";
import { saveFile } from "../frame/saveFile.js";
import { notSentText, type StepViewProps } from "../frame/stepViewProps.js";
import { ChangePictureForm } from "./ChangePictureForm.js";
import { OwnPictureButton } from "./OwnPictureButton.js";
import { fullPictureOf, uploadPicture } from "./pictureFiles.js";
import { PictureView } from "./PictureView.js";
import { SceneFields } from "./SceneFields.js";
import { useLargePicture } from "./useLargePicture.js";
import type { PictureCard } from "./usePictureCards.js";

const sentNote = "The AI works on the picture. You can follow it in the chat.";

const noClipLine =
  "This scene is not in the video yet. Ask the AI in the chat to change its picture.";

export function PictureDetail(
  props: StepViewProps & { output: Output; card: PictureCard },
) {
  const { client, snapshot, output, card, locked } = props;
  const [note, setNote] = useState("");
  const picture = useLargePicture({
    client,
    output,
    card,
    snapshot,
  });
  const clipId = card.clip?.id;
  const ask = async (request: FixedRequest): Promise<boolean> => {
    const isSent = await sendFixedRequest({ ask: props.ask, request });
    setNote(isSent ? sentNote : notSentText);
    return isSent;
  };
  return (
    <div className="picture-detail">
      <div className="picture-large">
        <PictureView
          picture={picture}
          shape={{
            aspectRatio: `${String(output.widthPixels)} / ${String(output.heightPixels)}`,
            width: `min(100%, calc(46vh * ${String(output.widthPixels / output.heightPixels)}))`,
          }}
        />
      </div>
      <div className="picture-controls">
        <h3>
          Scene {card.number}: {card.name}
        </h3>
        <SceneFields
          client={client}
          snapshot={snapshot}
          scene={card.scene}
          locked={locked}
        />
        {clipId === undefined ? (
          <p className="fact">{noClipLine}</p>
        ) : (
          <ChangePictureForm
            client={client}
            locked={locked}
            onAsk={(change) =>
              ask({
                kind: "change-the-picture",
                aboutClipId: clipId,
                ...change,
              })
            }
          />
        )}
        <div className="part-actions">
          {clipId === undefined ? undefined : (
            <OwnPictureButton
              locked={locked}
              onFile={async (file) => {
                setNote(`Adding ${file.name} to the project.`);
                const uploaded = await uploadPicture({ client, file });
                if (uploaded.kind === "failed") {
                  setNote(uploaded.message);
                  return;
                }
                await ask({
                  kind: "use-my-own-picture",
                  fileName: uploaded.fileName,
                  aboutClipId: clipId,
                });
              }}
            />
          )}
          <button
            type="button"
            onClick={() => {
              setNote("Making the picture at full size.");
              fullPictureOf({ client, output, card })
                .then((made) => {
                  if (made.kind === "failed") {
                    setNote(`The picture did not download: ${made.message}`);
                    return;
                  }
                  saveFile({
                    blob: made.blob,
                    fileName: `${card.scene.id}.png`,
                  });
                  setNote("");
                })
                .catch(() => undefined);
            }}
          >
            Download the picture
          </button>
        </div>
        <p className="fact" aria-live="polite">
          {note}
        </p>
      </div>
    </div>
  );
}
