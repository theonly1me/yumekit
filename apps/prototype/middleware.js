export const config = { matcher: "/(.*)" };

const realm = 'Basic realm="yumekit design", charset="UTF-8"';

function expectedAuthorization() {
  const user = process.env.REVIEW_USER;
  const password = process.env.REVIEW_PASSWORD;
  if (!user || !password) {
    return undefined;
  }
  return `Basic ${btoa(`${user}:${password}`)}`;
}

export default function middleware(request) {
  const expected = expectedAuthorization();
  const given = request.headers.get("authorization");

  if (expected !== undefined && given === expected) {
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  }

  return new Response("Sign in to see the yumekit editor design.", {
    status: 401,
    headers: { "WWW-Authenticate": realm },
  });
}
