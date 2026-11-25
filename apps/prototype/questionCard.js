import { questionRounds } from "./chatSeed.js";
import { sendAnswers } from "./projectFlow.js";
import { escapeText, notify, state } from "./state.js";

function questionsOfRound() {
  return questionRounds[state.questionRound.round];
}

export function questionCardMarkup() {
  const round = state.questionRound;
  if (round === undefined) {
    return "";
  }
  const questions = questionsOfRound();
  const question = questions[round.index];
  const answer = round.answers[round.index];
  const isLast = round.index === questions.length - 1;
  const own = answer !== undefined && !question.options.includes(answer);
  const chips = question.options
    .map(
      (option) =>
        `<button type="button" class="option-chip" data-option="${escapeText(option)}" aria-pressed="${answer === option}">${escapeText(option)}</button>`,
    )
    .join("");
  const ready = questions.every(
    (...[, index]) => (round.answers[index] ?? "").trim() !== "",
  );
  return `
    <section class="question-card" aria-label="Question from the lead">
      <p class="question-count">Question ${round.index + 1} of ${questions.length}</p>
      <p class="question-text">${escapeText(question.text)}</p>
      <div class="option-chips" role="group" aria-label="${escapeText(question.text)}">${chips}</div>
      <input type="text" id="own-answer" data-own-answer value="${own ? escapeText(answer) : ""}" placeholder="Or in your own words" aria-label="Your own answer" />
      <div class="question-nav">
        <button type="button" data-question-step="-1" ${round.index === 0 ? "disabled" : ""}>Back</button>
        ${isLast ? `<button type="button" class="primary" data-send-answers ${ready ? "" : "disabled"}>Send my answers</button>` : `<button type="button" class="primary" data-question-step="1">Next</button>`}
      </div>
    </section>`;
}

export function bindQuestionCard(element) {
  const round = state.questionRound;
  if (round === undefined) {
    return;
  }
  element.querySelectorAll("[data-option]").forEach((chip) => {
    chip.addEventListener("click", () => {
      round.answers[round.index] = chip.dataset.option;
      notify();
    });
  });
  element
    .querySelector("[data-own-answer]")
    .addEventListener("input", (event) => {
      round.answers[round.index] = event.target.value;
      element.querySelectorAll("[data-option]").forEach((chip) => {
        chip.setAttribute("aria-pressed", "false");
      });
      const send = element.querySelector("[data-send-answers]");
      if (send !== null) {
        send.disabled = !questionsOfRound().every(
          (...[, index]) => (round.answers[index] ?? "").trim() !== "",
        );
      }
    });
  element.querySelectorAll("[data-question-step]").forEach((button) => {
    button.addEventListener("click", () => {
      round.index += Number(button.dataset.questionStep);
      notify();
    });
  });
  element
    .querySelector("[data-send-answers]")
    ?.addEventListener("click", sendAnswers);
}
