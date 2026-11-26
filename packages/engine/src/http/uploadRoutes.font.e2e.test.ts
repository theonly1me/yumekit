import { describe, expect, it } from "vitest";
import { startedTestEngine } from "../testing/engineFixture.js";
import { bodyOf } from "../testing/rawRequest.js";
import { uploadRequest } from "../testing/uploadRequest.js";

describe("the upload of a font file", () => {
  it("adds a woff2 file as a font asset under its original name", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "Geist-Variable.woff2",
      body: Buffer.from("wOF2 font bytes"),
    });

    expect(uploaded.status).toBe(200);
    expect(bodyOf(uploaded)).toMatchObject({
      asset: {
        kind: "font",
        source: { kind: "import", originalName: "Geist-Variable.woff2" },
      },
    });
  });

  it("names a font in the failure text of a file that it does not take", async () => {
    const { engine } = await startedTestEngine();

    const uploaded = await uploadRequest({
      ...engine,
      name: "notes.txt",
      body: Buffer.from("plain words"),
    });

    expect(bodyOf(uploaded)).toMatchObject({
      message: "This file is not a picture, a sound, a video, or a font.",
    });
  });
});
