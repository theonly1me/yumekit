import type { IncomingMessage, ServerResponse } from "node:http";
import { methodNotAllowed, notFound, type Failure } from "../http/responses.js";
import { fileInside } from "./fileInside.js";
import { sendFile } from "./sendFile.js";

const editorPagePolicy = "frame-ancestors 'none'";

const editorNotBuiltPage = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>yumekit</title></head>
<body>
<h1>The editor is not built</h1>
<p>The engine runs, but this copy of yumekit has no built editor. Run <code>pnpm build</code> in the yumekit folder, then run <code>yumekit open</code> again.</p>
</body>
</html>
`;

function sendEditorNotBuilt(response: ServerResponse): void {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(editorNotBuiltPage),
    "Content-Security-Policy": `default-src 'none'; ${editorPagePolicy}`,
  });
  response.end(editorNotBuiltPage);
}

export async function sendStaticFile(options: {
  request: IncomingMessage;
  response: ServerResponse;
  editorFolder: string | undefined;
  segments: string[];
}): Promise<Failure | undefined> {
  const { request, response, editorFolder } = options;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return methodNotAllowed;
  }
  const isRoot = options.segments.length === 1 && options.segments[0] === "";
  const segments = isRoot ? ["index.html"] : options.segments;
  if (editorFolder === undefined || segments.includes("")) {
    return notFound("The engine has no such file.");
  }
  const file = await fileInside({ folder: editorFolder, segments });
  if (file === undefined && isRoot) {
    sendEditorNotBuilt(response);
    return undefined;
  }
  if (file === undefined) return notFound("The editor has no such file.");
  await sendFile({
    request,
    response,
    file,
    contentSecurityPolicy: editorPagePolicy,
  });
  return undefined;
}
