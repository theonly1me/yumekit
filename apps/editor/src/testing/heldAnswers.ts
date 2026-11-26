import type { Page, Route } from "playwright";
import { z } from "zod";

const projectSchema = z.object({ revision: z.number() });
const toolAnswerSchema = z.object({
  data: z.object({ revision: z.number() }),
});

export interface HeldAnswers {
  savedRevisions: () => number[];
  shownRevision: () => number;
  hold: () => void;
  release: () => void;
}

export async function holdEngineAnswers(page: Page): Promise<HeldAnswers> {
  const saved: number[] = [];
  let shown = 0;
  let isHolding = false;
  const released = Promise.withResolvers<undefined>();
  const answerLater = async (options: {
    route: Route;
    readRevision: (body: unknown) => number;
  }) => {
    const response = await options.route.fetch();
    const revision = options.readRevision(await response.json());
    if (isHolding) await released.promise;
    await options.route.fulfill({ response });
    return revision;
  };
  await page.route(/\/api\/tools\/set_script$/, async (route) => {
    await answerLater({
      route,
      readRevision: (body) => {
        const { revision } = toolAnswerSchema.parse(body).data;
        saved.push(revision);
        return revision;
      },
    });
  });
  await page.route(/\/api\/project$/, async (route) => {
    const revision = await answerLater({
      route,
      readRevision: (body) => projectSchema.parse(body).revision,
    });
    shown = Math.max(shown, revision);
  });
  return {
    savedRevisions: () => [...saved],
    shownRevision: () => shown,
    hold: () => {
      isHolding = true;
    },
    release: () => {
      released.resolve(undefined);
    },
  };
}
