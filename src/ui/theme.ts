import type { Board } from "../store";
import type { ThemeName } from "../types";

export const VALID_THEMES: ThemeName[] = [
  "sky",
  "grape",
  "slate",
  "sunset",
  "forest",
  "ocean",
  "sand",
  "rose",
];

export function normalizeTheme(value: string | undefined): ThemeName {
  const theme = (value ?? "").toLowerCase() as ThemeName;
  return VALID_THEMES.includes(theme) ? theme : "sky";
}

export function applyThemeFromBoard(
  board: Board,
  themeSelect: HTMLSelectElement,
): void {
  const theme = normalizeTheme(board.snapshot.theme as string | undefined);
  themeSelect.value = theme;
  document.documentElement.setAttribute("data-theme", theme);
  board.setTheme(theme);
}

export function bindThemeChange(
  getBoard: () => Board,
  themeSelect: HTMLSelectElement,
): void {
  themeSelect.addEventListener("change", () => {
    const board = getBoard();
    const theme = themeSelect.value as ThemeName;
    const root = document.documentElement;

    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    board.setTheme(theme);

    window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 280);
  });
}
