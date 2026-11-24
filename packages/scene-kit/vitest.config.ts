import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";

const testPictureSvg = (pictureIndex: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><text x="10" y="50">${pictureIndex}</text></svg>`;

export default defineProject({
  plugins: [
    {
      name: "test-frame-pictures",
      configureServer(server) {
        server.middlewares.use("/test-frame-pictures/", (...parameters) => {
          const [request, response] = parameters;
          const pictureIndex = /^\/(?:[a-z]+-)?(\d+)\.jpg$/.exec(
            request.url ?? "",
          )?.[1];
          if (pictureIndex === undefined) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.setHeader("Content-Type", "image/svg+xml");
          response.end(testPictureSvg(pictureIndex));
        });
      },
    },
  ],
  test: {
    name: "scene-kit-browser",
    include: ["src/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
