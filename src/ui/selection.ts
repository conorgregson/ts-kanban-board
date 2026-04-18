import type { Board } from "../store";
import type { ColumnId, TaskId } from "../types";
import type { SelectionState } from "./contracts";

export function clearSelection(state: SelectionState): void {
  state.selectedTasks.clear();
  state.lastSelectedTask = null;
}

export function handleTaskSelection(
  board: Board,
  state: SelectionState,
  event: MouseEvent,
  taskId: TaskId,
  columnId: ColumnId,
): void {
  const isCtrl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;

  if (isShift && state.lastSelectedTask) {
    const column = board.columns.read(columnId);
    if (!column) return;

    const ids = column.taskIds;
    const start = ids.indexOf(state.lastSelectedTask);
    const end = ids.indexOf(taskId);

    if (start === -1 || end === -1) {
      state.selectedTasks.clear();
      state.selectedTasks.add(taskId);
    } else {
      state.selectedTasks.clear();
      const [startIndex, endIndex] = start < end ? [start, end] : [end, start];

      for (let i = startIndex; i <= endIndex; i++) {
        const idAtIndex = ids[i];
        if (idAtIndex) {
          state.selectedTasks.add(idAtIndex);
        }
      }
    }
  } else if (isCtrl) {
    if (state.selectedTasks.has(taskId)) {
      state.selectedTasks.delete(taskId);
    } else {
      state.selectedTasks.add(taskId);
    }
  } else {
    state.selectedTasks.clear();
    state.selectedTasks.add(taskId);
  }

  state.lastSelectedTask = taskId;
}

export function removeTaskFromSelection(
  state: SelectionState,
  taskId: TaskId,
): void {
  state.selectedTasks.delete(taskId);

  if (state.lastSelectedTask === taskId) {
    state.lastSelectedTask = null;
  }
}

export function removeColumnTasksFromSelection(
  state: SelectionState,
  taskIds: TaskId[],
): void {
  for (const taskId of taskIds) {
    state.selectedTasks.delete(taskId);
  }

  if (state.lastSelectedTask && taskIds.includes(state.lastSelectedTask)) {
    state.lastSelectedTask = null;
  }
}
