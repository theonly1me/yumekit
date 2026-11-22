import { request, type IncomingHttpHeaders } from "node:http";

export interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
  bytes: Buffer;
}

export function rawRequest(options: {
  port: number;
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
}): Promise<RawResponse> {
  const answered = Promise.withResolvers<RawResponse>();
  const sent = request(
    {
      host: "127.0.0.1",
      port: options.port,
      path: options.path,
      method: options.method ?? "GET",
      headers: options.headers ?? {},
    },
    (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        answered.resolve({
          status: response.statusCode ?? 0,
          headers: response.headers,
          body: bytes.toString(),
          bytes,
        });
      });
      response.on("error", answered.reject);
    },
  );
  sent.on("error", answered.reject);
  sent.end(options.body);
  return answered.promise;
}

export function withToken(options: {
  token: string;
  headers?: Record<string, string>;
}): Record<string, string> {
  return { authorization: `Bearer ${options.token}`, ...options.headers };
}

export async function callTool(options: {
  port: number;
  token: string;
  name: string;
  input: object;
  callId?: string;
  headers?: Record<string, string>;
}): Promise<RawResponse> {
  return rawRequest({
    port: options.port,
    path: `/api/tools/${options.name}`,
    method: "POST",
    headers: withToken({
      token: options.token,
      headers: { "content-type": "application/json", ...options.headers },
    }),
    body: JSON.stringify({
      input: options.input,
      ...(options.callId === undefined ? {} : { callId: options.callId }),
    }),
  });
}

export const titleScene = {
  scene_id: "intro",
  title: "Intro",
  kit_component: "title-card",
  props: { heading: "The lake" },
};

export function bodyOf(answer: RawResponse): unknown {
  const value: unknown = JSON.parse(answer.body);
  return value;
}

export function textFieldOf(options: {
  answer: RawResponse;
  name: string;
}): string {
  const value = bodyOf(options.answer);
  const field: unknown =
    typeof value === "object" && value !== null
      ? Reflect.get(value, options.name)
      : undefined;
  return typeof field === "string" ? field : "";
}

export async function previewOriginOf(engine: {
  port: number;
  token: string;
}): Promise<string> {
  const answer = await rawRequest({
    port: engine.port,
    path: "/api/preview",
    headers: withToken(engine),
  });
  return new URL(textFieldOf({ answer, name: "pageUrl" })).origin;
}
