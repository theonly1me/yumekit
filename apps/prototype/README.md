# @yumekit/prototype

This package is the approved design direction of the editor. It is a mock with fake data. It is not the product.

The real editor is in `apps/editor`. The editor follows this prototype. If the editor and the prototype disagree on a screen, change the editor, or change the prototype first in its own pull request.

## Open it on your computer

1. Run `pnpm install` at the root of the repository.
2. Run `pnpm --filter @yumekit/prototype start`.
3. Open `http://127.0.0.1:4173/`.

To use a different port, set `PORT`, for example `PORT=5000 pnpm --filter @yumekit/prototype start`.

The page is plain HTML, CSS, and JavaScript modules. It has no build step and no dependency.

## Deploy it

The owner deploys this folder as a static site on Vercel. The Vercel project settings stay outside the repository.

`middleware.js` asks for a user name and a password before it shows the site. Set these environment variables in the Vercel project:

| Variable          | Value                        |
| ----------------- | ---------------------------- |
| `REVIEW_USER`     | The user name for the review |
| `REVIEW_PASSWORD` | The password for the review  |

If one of the two is not set, the site refuses each request.
