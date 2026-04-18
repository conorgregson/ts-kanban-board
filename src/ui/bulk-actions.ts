import { Board } from "../store";
import { ColumnId, TaskId } from "../types";
import { showToast } from "./feedback";
import { BulkActionsContext } from "./contracts";
import { clearSelection } from "./selection";

export function updateBulkActionsBar(
  bulkBar: HTMLElement,
  bulkCountEl: HTMLElement,
  bulkMoveSelect: HTMLSelectElement,
  selectedTasks: Set<TaskId>,
  board: Board,
): void {
  const count = selectedTasks.size;

  if (count === 0) {
    bulkBar.classList.add("hidden");
    bulkCountEl.textContent = "0 selected";
    bulkMoveSelect.innerHTML = "";
    return;
  }

  bulkBar.classList.remove("hidden");
  bulkCountEl.textContent = `${count} selected`;

  bulkMoveSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Move selected tasks...";
  placeholder.selected = true;
  bulkMoveSelect.appendChild(placeholder);

  for (const column of board.snapshot.columns) {
    const option = document.createElement("option");
    option.value = column.id;
    option.textContent = `Move to: ${column.title}`;
    bulkMoveSelect.appendChild(option);
  }
}

export function bulkClearSelection(context: BulkActionsContext): void {
  clearSelection(context.selection);
  context.render();
}

export function bulkDelete(context: BulkActionsContext): void {
  const { selection, findTaskColumn, board, render } = context;

  if (selection.selectedTasks.size === 0) return;

  const count = selection.selectedTasks.size;
  const ok = confirm(`Delete ${count} selected task${count === 1 ? "" : "s"}?`);
  if (!ok) return;

  for (const taskId of Array.from(selection.selectedTasks)) {
    const columnId = findTaskColumn(taskId);
    if (!columnId) continue;

    board.columns.removeTask(columnId, taskId);
    board.tasks.remove(taskId);
  }

  clearSelection(selection);
  render();
}

export function bulkMoveToColumn(
  context: BulkActionsContext,
  destinationColumnId: ColumnId,
): void {
  const { selection, findTaskColumn, board, render } = context;

  if (selection.selectedTasks.size === 0) return;

  let moved = 0;
  let skippedFull = 0;
  let skippedSameColumn = 0;

  for (const taskId of Array.from(selection.selectedTasks)) {
    const sourceColumnId = findTaskColumn(taskId);
    if (!sourceColumnId) continue;

    if (sourceColumnId === destinationColumnId) {
      skippedSameColumn++;
      continue;
    }

    if (board.columns.isFull(destinationColumnId)) {
      skippedFull++;
      continue;
    }

    board.columns.moveTask(sourceColumnId, destinationColumnId, taskId);
    moved++;
  }

  clearSelection(selection);
  render();

  if (moved > 0 && skippedFull > 0) {
    showToast(
      `Moved ${moved} task${moved === 1 ? "" : "s"}. ${skippedFull} skipped because the destination hit its WIP limit.`,
      "info",
    );
    return;
  }

  if (moved > 0 && skippedSameColumn > 0) {
    showToast(
      `Moved ${moved} task${moved === 1 ? "" : "s"}. ${skippedSameColumn} already belonged to that column.`,
      "info",
    );
    return;
  }

  if (moved === 0 && skippedFull > 0) {
    showToast(
      "No tasks moved. Destination column is already at its WIP limit.",
      "error",
    );
    return;
  }

  if (moved === 0 && skippedSameColumn > 0) {
    showToast(
      "No tasks moved. Selected tasks are already in that column.",
      "info",
    );
    return;
  }

  if (moved > 0) {
    showToast(`Moved ${moved} task${moved === 1 ? "" : "s"}.`, "success");
  }
}

export function bulkEditLabels(context: BulkActionsContext): void {
  const firstId = Array.from(context.selection.selectedTasks)[0];
  if (!firstId) return;

  context.openLabelEditorForTask(firstId);
}
