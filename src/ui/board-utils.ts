import type { Board } from "../store";
import type { ColumnId, TaskId } from "../types";

export const WIP_PRESETS: Array<number | null> = [null, 2, 3, 5, 8, 13];

export function findTaskColumn(board: Board, taskId: TaskId): ColumnId | null {
  for (const column of board.snapshot.columns) {
    if (column.taskIds.includes(taskId)) {
      return column.id;
    }
  }

  return null;
}

export function indexFromPointer(listEl: HTMLElement, clientY: number): number {
  const items = Array.from(listEl.children) as HTMLElement[];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const rect = item.getBoundingClientRect();
    const halfway = rect.top + rect.height / 2;

    if (clientY < halfway) {
      return i;
    }
  }

  return items.length;
}

export function findTaskCard(taskId: TaskId): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `.kan-task[data-task="${taskId}"]`,
  );
}
