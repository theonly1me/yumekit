export const motionOffRule =
  "*, *::before, *::after { animation: none !important; transition: none !important; }";

export function turnOffCssMotion(): () => void {
  const style = document.createElement("style");
  style.dataset["yumekitGuard"] = "motion-off";
  style.textContent = motionOffRule;
  document.head.append(style);
  return () => {
    style.remove();
  };
}
