import { notify, state } from "./state.js";

export function keyGuideMarkup({ tool, saveLabel }) {
  const steps = tool.steps.map((step) => `<li>${step}</li>`).join("");
  return `
    <div class="key-guide">
      <ol class="key-steps">${steps}</ol>
      <button type="button" data-open-site>Open ${tool.site}</button>
      <form class="key-form" data-save-key="${tool.id}">
        <label for="key-${tool.id}">${tool.keyName}</label>
        <input type="password" id="key-${tool.id}" autocomplete="off" placeholder="Paste the key" required />
        <button type="submit" class="primary">${saveLabel}</button>
      </form>
      <p class="fact">The key stays in one file on this computer. The AI never sees it.</p>
    </div>`;
}

export function bindKeyGuide({ element }) {
  element.querySelectorAll("[data-save-key]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      state.keys[form.dataset.saveKey] = true;
      notify();
    });
  });
  element.querySelectorAll("[data-open-site]").forEach((button) => {
    button.addEventListener("click", () => {
      button.textContent = "Opened in your browser";
    });
  });
}
