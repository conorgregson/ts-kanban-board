import { Task } from "../types";
import { renderFilterChips } from "./labels";

export interface FilterState {
  text: string;
  labels: Set<string>;
}

export function createFilterState(): FilterState {
  return {
    text: "",
    labels: new Set<string>(),
  };
}

export function clearFilters(state: FilterState): void {
  state.text = "";
  state.labels.clear();
}

export function matchesFilters(
  state: FilterState,
  task: Task | undefined,
): boolean {
  if (!task) return false;

  const text = state.text.trim().toLowerCase();
  if (text) {
    const title = task.title.toLowerCase();
    if (!title.includes(text)) return false;
  }

  if (state.labels.size > 0) {
    const labels = (task.labels ?? []).map((label) => label.toLowerCase());
    let hasAny = false;

    for (const filterLabel of state.labels) {
      if (labels.includes(filterLabel)) {
        hasAny = true;
        break;
      }
    }

    if (!hasAny) return false;
  }

  return true;
}

export function renderFiltersUI(
  filterTextInput: HTMLInputElement,
  filterLabelsEl: HTMLElement,
  state: FilterState,
  onToggleLabel: () => void,
): void {
  filterTextInput.value = state.text;
  renderFilterChips(filterLabelsEl, state.labels, onToggleLabel);
}
