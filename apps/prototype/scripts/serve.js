import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = Number(process.env.PORT ?? "4173");
const root = fileURLToPath(new URL("..", import.meta.url));

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function decodedPath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return undefined;
  }
}

function fileOf(requestUrl) {
  const { pathname } = new URL(requestUrl, `http://${host}`);
  const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const decoded = decodedPath(relative);
  if (decoded === undefined) {
    return undefined;
  }
  const file = resolve(root, `.${decoded}`);
  return file.startsWith(root) ? file : undefined;
}

function send({ response, status, body, type }) {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

async function answer({ request, response }) {
  const file = fileOf(request.url ?? "/");
  if (file === undefined) {
    send({ response, status: 403, body: "Forbidden", type: "text/plain" });
    return;
  }
  if (!(await isFile(file))) {
    send({ response, status: 404, body: "Not found", type: "text/plain" });
    return;
  }
  send({
    response,
    status: 200,
    body: await readFile(file),
    type: contentTypes[extname(file)] ?? "application/octet-stream",
  });
}

const server = createServer((...parameters) => {
  const [request, response] = parameters;
  answer({ request, response }).catch(() => {
    send({ response, status: 500, body: "Server error", type: "text/plain" });
  });
});

server.listen(port, host, () => {
  console.log(`The prototype is at http://${host}:${String(port)}/`);
});
