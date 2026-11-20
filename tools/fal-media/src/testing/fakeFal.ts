import { z } from "zod";

export const fakeUrls = {
  statusUrl:
    "https://queue.fal.run/bytedance/seedance-2.5/requests/req-1/status",
  responseUrl: "https://queue.fal.run/bytedance/seedance-2.5/requests/req-1",
  videoUrl: "https://v3b.fal.media/files/b/test/output.mp4",
  uploadUrlPrefix: "https://v3b.fal.media/upload/",
  fileUrlPrefix: "https://v3b.fal.media/files/b/test/",
} as const;

const initiateBody = z.object({ file_name: z.string() });

function box(options: { type: string; content: Buffer }): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + options.content.length, 0);
  header.write(options.type, 4, "latin1");
  return Buffer.concat([header, options.content]);
}

export function fakeMp4(options: {
  widthPixels: number;
  heightPixels: number;
  durationSeconds: number;
}): Buffer {
  const timescale = 1000;
  const mvhd = Buffer.alloc(100);
  mvhd.writeUInt32BE(timescale, 12);
  mvhd.writeUInt32BE(options.durationSeconds * timescale, 16);
  const tkhd = Buffer.alloc(84);
  tkhd.writeUInt32BE(options.widthPixels * 65536, 76);
  tkhd.writeUInt32BE(options.heightPixels * 65536, 80);
  const trak = box({
    type: "trak",
    content: box({ type: "tkhd", content: tkhd }),
  });
  const moov = box({
    type: "moov",
    content: Buffer.concat([box({ type: "mvhd", content: mvhd }), trak]),
  });
  return Buffer.concat([
    box({ type: "ftyp", content: Buffer.from("isom0000", "latin1") }),
    moov,
  ]);
}

export function fakeFal(options: {
  statuses?: string[];
  video?: Buffer;
  answer?: (request: Request) => Promise<Response> | undefined;
}): (request: Request) => Promise<Response> {
  const statuses = [...(options.statuses ?? ["COMPLETED"])];
  return async (request) => {
    const answered = options.answer?.(request);
    if (answered !== undefined) return answered;
    const url = new URL(request.url);
    if (url.pathname === "/storage/upload/initiate") {
      const body = initiateBody.parse(await request.json());
      return Response.json({
        upload_url: `${fakeUrls.uploadUrlPrefix}${body.file_name}`,
        file_url: `${fakeUrls.fileUrlPrefix}${body.file_name}`,
      });
    }
    if (request.url.startsWith(fakeUrls.uploadUrlPrefix)) {
      return new Response(null, { status: 200 });
    }
    if (request.url === fakeUrls.statusUrl) {
      const status = statuses.shift() ?? "COMPLETED";
      return Response.json(
        { status, request_id: "req-1" },
        { status: status === "COMPLETED" ? 200 : 202 },
      );
    }
    if (request.url === fakeUrls.responseUrl) {
      return Response.json({ video: { url: fakeUrls.videoUrl }, seed: 42 });
    }
    if (request.url === fakeUrls.videoUrl) {
      const video =
        options.video ??
        fakeMp4({ widthPixels: 1280, heightPixels: 720, durationSeconds: 5 });
      return new Response(new Uint8Array(video));
    }
    if (url.hostname === "queue.fal.run" && request.method === "POST") {
      return Response.json({
        status: "IN_QUEUE",
        request_id: "req-1",
        status_url: fakeUrls.statusUrl,
        response_url: fakeUrls.responseUrl,
      });
    }
    if (url.pathname === "/v1/models/pricing") {
      return Response.json({ prices: [], has_more: false, next_cursor: null });
    }
    return Response.json(
      { detail: `No fake for ${request.url}` },
      { status: 404 },
    );
  };
}
