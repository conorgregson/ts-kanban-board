export const COMMON_LABELS: string[] = [
  "bug",
  "feature",
  "improvement",
  "urgent",
  "low",
  "future",
  "ui",
  "frontend",
  "backend",
  "blocked",
  "research",
];

const COLOR_NAMES = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "cyan",
  "blue",
  "violet",
  "pink",
  "grey",
] as const;

const LABEL_COLORS: Record<string, string> = {
  bug: "red",
  issue: "red",
  hotfix: "red",
  error: "red",

  urgent: "orange",
  asap: "orange",
  high: "orange",

  priority: "yellow",

  low: "grey",
  minor: "grey",
  future: "grey",

  feature: "green",
  enhancement: "green",
  idea: "green",

  research: "violet",

  design: "pink",
  ux: "pink",
  ui: "pink",

  frontend: "cyan",
  client: "cyan",

  backend: "blue",
  api: "blue",
  server: "blue",

  blocked: "lime",
  waiting: "lime",
};

function hashLabel(str: string, mod = 10): number {
  let hashValue = 0;
  for (let i = 0; i < str.length; i++) {
    hashValue = (hashValue * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hashValue % mod;
}

function getLabelColorName(label: string): string {
  const key = label.trim().toLowerCase();
  let colorName = LABEL_COLORS[key];

  if (!colorName) {
    const index = hashLabel(key, COLOR_NAMES.length);
    colorName = COLOR_NAMES[index];
  }

  return colorName;
}

export function renderTaskLabels(
  container: HTMLElement,
  labels: readonly string[],
) {
  container.innerHTML = "";

  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;

    const colorName = getLabelColorName(label);

    const span = document.createElement("span");
    span.className = `task-label label-color-${colorName}`;
    span.textContent = label;

    container.appendChild(span);
  }
}

export function renderLabelEditorChips(
  container: HTMLElement,
  activeLabels: Set<string>,
) {
  container.innerHTML = "";

  for (const base of COMMON_LABELS) {
    const label = base;
    const key = label.toLowerCase();
    const colorName = getLabelColorName(label);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = label;
    chip.dataset.label = label;
    chip.className = `label-chip label-color-${colorName}`;

    if (activeLabels.has(label) || activeLabels.has(key)) {
      chip.classList.add("label-chip--active");
    }

    chip.addEventListener("click", () => {
      const normalized = label;

      if (activeLabels.has(normalized)) {
        activeLabels.delete(normalized);
        chip.classList.remove("label-chip--active");
      } else {
        activeLabels.add(normalized);
        chip.classList.add("label-chip--active");
      }
    });

    container.appendChild(chip);
  }
}

export function renderFilterChips(
  container: HTMLElement,
  filterLabels: Set<string>,
  onToggle: () => void,
) {
  container.innerHTML = "";

  for (const base of COMMON_LABELS) {
    const label = base;
    const key = label.toLowerCase();
    const colorName = getLabelColorName(label);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = label;
    chip.dataset.label = label;
    chip.className = `label-chip label-color-${colorName}`;

    if (filterLabels.has(key)) {
      chip.classList.add("label-chip--active");
    }

    chip.addEventListener("click", () => {
      if (filterLabels.has(key)) {
        filterLabels.delete(key);
      } else {
        filterLabels.add(key);
      }

      chip.classList.toggle("label-chip--active");
      onToggle();
    });

    container.appendChild(chip);
  }
}
