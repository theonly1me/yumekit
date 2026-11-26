export const fakeTask = {
  id: "987654321",
  tasksUrl:
    "https://api.sand.ai/compatible/ark/api/v3/contents/generations/tasks",
  videoUrl: "https://files.example.com/video.mp4?signature=example",
} as const;

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

export function arkError(options: {
  status: number;
  code: string;
  message: string;
}): Response {
  return Response.json(
    {
      error: {
        code: options.code,
        type: "BadRequest",
        message: options.message,
      },
    },
    { status: options.status },
  );
}

export function taskAnswer(options: {
  status: string;
  error?: { code: string; message: string };
}): Response {
  return Response.json({
    id: fakeTask.id,
    model: "magi-2",
    status: options.status,
    created_at: 1794614400,
    updated_at: 1794614460,
    ...(options.status === "succeeded"
      ? { content: { video_url: fakeTask.videoUrl }, duration: 5 }
      : {}),
    ...(options.error === undefined ? {} : { error: options.error }),
  });
}

export function fakeSand(options: {
  created?: () => Response;
  polls?: (() => Response)[];
  video?: Buffer;
}): (request: Request) => Promise<Response> {
  const polls = [...(options.polls ?? [])];
  return (request) => {
    if (request.method === "POST" && request.url === fakeTask.tasksUrl) {
      return Promise.resolve(
        options.created?.() ?? Response.json({ id: fakeTask.id }),
      );
    }
    if (request.url === `${fakeTask.tasksUrl}/${fakeTask.id}`) {
      const next = polls.shift();
      return Promise.resolve(next?.() ?? taskAnswer({ status: "succeeded" }));
    }
    if (request.url === fakeTask.videoUrl) {
      const video =
        options.video ??
        fakeMp4({ width: 1920, height: 1080, durationSeconds: 5 });
      return Promise.resolve(new Response(new Uint8Array(video)));
    }
    return Promise.resolve(
      Response.json(
        { code: "invalid_request", message: "No fake" },
        { status: 404 },
      ),
    );
  };
}
