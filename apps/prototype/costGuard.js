import { projectLimits } from "./limits.js";
import { notify, state } from "./state.js";
import { money, projectSpent } from "./takesStore.js";

export function guardCost({ cost, what, run, fewer }) {
  const left = projectLimits().dollars - projectSpent();
  if (cost <= left) {
    run();
    return;
  }
  state.costWarning = {
    text: `${what} cost about ${money(cost)} and ${money(Math.max(0, left))} is left.`,
    raiseTo: Math.ceil((projectSpent() + cost) / 10) * 10,
    run,
    fewer: fewer(Math.max(0, left)),
  };
  notify();
}

export function warningMarkup() {
  const warning = state.costWarning;
  if (warning === undefined) {
    return "";
  }
  return `
    <div class="cost-warning" role="alert">
      <p>${warning.text} Nothing is spent until you pick.</p>
      <button type="button" class="primary" data-cost="raise">Raise this project to $${warning.raiseTo}</button>
      ${warning.fewer === undefined ? "" : `<button type="button" data-cost="fewer">${warning.fewer.label}</button>`}
      <button type="button" data-cost="stop">Stop here</button>
    </div>`;
}

export function bindWarning(element) {
  const warning = state.costWarning;
  if (warning === undefined) {
    return;
  }
  const actions = {
    raise: () => {
      state.limits.own = true;
      state.limits.project = {
        ...projectLimits(),
        dollars: warning.raiseTo,
      };
      warning.run();
    },
    fewer: () => warning.fewer?.run(),
    stop: () => undefined,
  };
  element.querySelectorAll("[data-cost]").forEach((button) => {
    button.addEventListener("click", () => {
      state.costWarning = undefined;
      actions[button.dataset.cost]();
      notify();
    });
  });
}
