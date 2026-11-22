import { describe, expect, it } from "vitest";
import { oneTimeModelSentence, serviceAndModelText } from "./mediaChoices.js";

const gptImage = {
  server: "openai",
  serverLabel: "OpenAI",
  model: "gpt-image-2.5-flare",
  modelLabel: "GPT Image 2.5 Flare",
};

const undescribed = {
  server: "custom",
  serverLabel: "custom",
  model: undefined,
  modelLabel: undefined,
};

describe("the texts of a model pick", () => {
  it("names the model and the service in the sentence of a fixed request", () => {
    expect(oneTimeModelSentence(gptImage)).toBe(
      "Use the model GPT Image 2.5 Flare of OpenAI.",
    );
  });

  it("names only the service when the service describes no model", () => {
    expect(oneTimeModelSentence(undescribed)).toBe("Use the service custom.");
  });

  it("shows the service and the model for the line Made with", () => {
    expect(serviceAndModelText(gptImage)).toBe("OpenAI, GPT Image 2.5 Flare");
    expect(serviceAndModelText(undescribed)).toBe("custom");
  });
});
