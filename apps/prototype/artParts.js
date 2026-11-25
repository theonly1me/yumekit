const skin = "#e6c4a2";
const legs = "#2a2622";
const arms = {
  stand: "M-4 -20 L-6 -9 M4 -20 L6 -9",
  reach: "M-4 -20 L-6 -9 M4 -20 L8 -32",
  pull: "M-4 -20 L-1 -34 M4 -20 L1 -34",
  wave: "M-4 -20 L-6 -9 M4 -20 L10 -27",
  carry: "M-4 -20 L-2 -12 M4 -20 L2 -12",
};

export function figure({
  x,
  y,
  scale = 1,
  look,
  pose = "stand",
  back = false,
}) {
  const face = back ? "" : `<circle cx="0" cy="-25.4" r="3.1" fill="${skin}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-3.6" y="-7" width="2.8" height="7" fill="${legs}"/><rect x="0.8" y="-7" width="2.8" height="7" fill="${legs}"/>
    <path d="M-4.4 -21 L4.4 -21 L6.4 -6 L-6.4 -6 Z" fill="${look.coat}"/>
    <path d="${arms[pose]}" stroke="${look.coat}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <circle cx="0" cy="-26.4" r="4" fill="${look.hair}"/>${face}
  </g>`;
}

export function boat({ x, y, scale = 1, color = "#e6e0d4" }) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-15 0 L15 0 L11 6 L-11 6 Z" fill="${color}"/>
    <rect x="-6" y="-6" width="9" height="6" fill="${color}" opacity="0.85"/>
    <path d="M6 0 L6 -16" stroke="${color}" stroke-width="0.8"/>
  </g>`;
}

export function tower({ x, y, scale = 1 }) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-4" y="-30" width="8" height="30" fill="#d9d3c6"/>
    <path d="M-6 -30 L0 -38 L6 -30 Z" fill="#4a3b33"/>
    <rect x="-1.6" y="-26" width="3.2" height="4" fill="#ffd98a"/>
  </g>`;
}

export function bell({ x, y, scale = 1, cracked = false }) {
  const crack = cracked
    ? `<path d="M1 -6 L-1 -1 L2 3 L0 8" stroke="#2a1d12" stroke-width="0.7" fill="none"/>`
    : "";
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-7 8 Q-7 -6 0 -9 Q7 -6 7 8 Z" fill="#a7742f"/>
    <path d="M-4 6 Q-4 -4 -1 -7" stroke="#e5b66a" stroke-width="1" fill="none" opacity="0.7"/>
    <rect x="-8.5" y="7.5" width="17" height="2" rx="1" fill="#80561f"/>${crack}
  </g>`;
}

export function lantern({ x, y, scale = 1 }) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle r="9" fill="#ffd98a" opacity="0.18"/><circle r="4.5" fill="#ffd98a" opacity="0.35"/>
    <rect x="-2.2" y="-3" width="4.4" height="6" rx="1" fill="#ffe7b0"/>
  </g>`;
}

export function rope({ x, y, scale = 1 }) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#b89567" stroke-width="1.6">
    <ellipse rx="10" ry="4"/><ellipse rx="7" ry="2.8"/><ellipse rx="4" ry="1.6"/>
  </g>`;
}

export function sea({ y, color }) {
  const waves = [8, 16, 24]
    .map(
      (step) =>
        `<path d="M0 ${y + step} Q40 ${y + step - 2} 80 ${y + step} T160 ${y + step}" stroke="#fff" stroke-opacity="0.12" fill="none"/>`,
    )
    .join("");
  return `<rect x="-20" y="${y}" width="200" height="${100 - y}" fill="${color}"/>${waves}`;
}

export function land({ y, color }) {
  return `<path d="M-20 ${y} Q40 ${y - 8} 90 ${y - 2} T180 ${y} L180 100 L-20 100 Z" fill="${color}"/>`;
}

export function sun({ x, y, color }) {
  return `<circle cx="${x}" cy="${y}" r="16" fill="${color}" opacity="0.25"/><circle cx="${x}" cy="${y}" r="7" fill="${color}"/>`;
}

export function fog({ amount }) {
  const bands = [...[30, 44, 56, 68].entries()]
    .map(
      ([index, top]) =>
        `<rect x="${-30 + index * 12}" y="${top}" width="220" height="16" rx="8" fill="#eef1f2" opacity="${amount * (0.5 + index * 0.12)}"/>`,
    )
    .join("");
  return `<g class="art-drift">${bands}</g>`;
}

export function snow() {
  const flakes = [];
  for (let index = 0; index < 46; index += 1) {
    const x = (index * 37) % 160;
    const y = (index * 53) % 90;
    flakes.push(
      `<circle cx="${x}" cy="${y}" r="${0.5 + (index % 3) * 0.3}" fill="#fff" opacity="0.8"/>`,
    );
  }
  return `<g class="art-drift">${flakes.join("")}</g>`;
}

export function stair({ color }) {
  const steps = [];
  for (let index = 0; index < 9; index += 1) {
    steps.push(
      `<rect x="${10 + index * 16}" y="${82 - index * 8}" width="18" height="${8 + index * 8}" fill="${color}" opacity="${0.6 + index * 0.04}"/>`,
    );
  }
  return steps.join("");
}

export function line({ from, to, color = "#b89567" }) {
  return `<path d="M${from.join(" ")} L${to.join(" ")}" stroke="${color}" stroke-width="1.2" fill="none"/>`;
}

export function windowView() {
  return `<rect x="96" y="14" width="44" height="40" fill="#8fb5cf"/><rect x="96" y="40" width="44" height="14" fill="#3f6782"/><path d="M118 14 L118 54 M96 34 L140 34" stroke="#2a2c33" stroke-width="2"/>`;
}
