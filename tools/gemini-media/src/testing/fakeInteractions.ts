function box(options: { type: string; payload: Buffer }): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + options.payload.length, 0);
  header.write(options.type, 4, "latin1");
  return Buffer.concat([header, options.payload]);
}

export function fakeMp4(options: {
  width: number;
  height: number;
  durationSeconds: number;
}): Buffer {
  const timescale = 1000;
  const mvhd = Buffer.alloc(100);
  mvhd.writeUInt32BE(timescale, 12);
  mvhd.writeUInt32BE(options.durationSeconds * timescale, 16);
  const tkhd = Buffer.alloc(84);
  tkhd.writeUInt32BE(options.width * 65536, 76);
  tkhd.writeUInt32BE(options.height * 65536, 80);
  return Buffer.concat([
    box({ type: "ftyp", payload: Buffer.from("isom0000", "latin1") }),
    box({
      type: "moov",
      payload: Buffer.concat([
        box({ type: "mvhd", payload: mvhd }),
        box({ type: "trak", payload: box({ type: "tkhd", payload: tkhd }) }),
      ]),
    }),
  ]);
}

export const sampleVideo = fakeMp4({
  width: 1280,
  height: 720,
  durationSeconds: 5,
});

export function inProgressInteraction(id: string): Response {
  return Response.json({ id, status: "in_progress", object: "interaction" });
}

export function completedInteraction(options: {
  id: string;
  video: Buffer;
  videoTokens?: number;
  uri?: string;
}): Response {
  const videoPart =
    options.uri === undefined
      ? { data: options.video.toString("base64") }
      : { uri: options.uri };
  return Response.json({
    id: options.id,
    status: "completed",
    object: "interaction",
    model: "gemini-omni-1.2-flash",
    steps: [
      { type: "user_input", content: [{ type: "text", text: "A lake" }] },
      { type: "thought", content: [{ type: "thought", text: "Planning" }] },
      {
        type: "model_output",
        content: [{ type: "video", mime_type: "video/mp4", ...videoPart }],
      },
    ],
    ...(options.videoTokens === undefined
      ? {}
      : {
          usage: {
            total_output_tokens: options.videoTokens + 40,
            output_tokens_by_modality: [
              { modality: "text", tokens: 40 },
              { modality: "video", tokens: options.videoTokens },
            ],
          },
        }),
  });
}

export function apiError(options: {
  status: number;
  message: string;
}): Response {
  return Response.json(
    { error: { code: "invalid_request", message: options.message } },
    { status: options.status },
  );
}
