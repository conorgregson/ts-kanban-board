import type { Board } from "../store";
import type { Column, ColumnId, TaskId } from "../types";

export interface SelectionState {
  selectedTasks: Set<TaskId>;
  lastSelectedTask: TaskId | null;
}

export interface BulkActionsContext {
  board: Board;
  selection: SelectionState;
  findTaskColumn: (taskId: TaskId) => ColumnId | null;
  render: () => void;
  openLabelEditorForTask: (taskId: TaskId) => void;
}

export interface RenderTaskOptions {
  board: Board;
  taskId: TaskId;
  fromColumnId: ColumnId;
  selectedTasks: Set<TaskId>;
  onTaskClick: (event: MouseEvent, taskId: TaskId, columnId: ColumnId) => void;
  onRender: () => void;
  onTaskDeleted: (taskId: TaskId, fromColumnId: ColumnId) => void;
}

export interface RenderColumnOptions {
  board: Board;
  column: Column;
  matchesFilters: (taskId: TaskId) => boolean;
  selectedTasks: Set<TaskId>;
  onTaskClick: (event: MouseEvent, taskId: TaskId, columnId: ColumnId) => void;
  onRender: () => void;
  onColumnDeleted: (columnId: ColumnId, taskIds: TaskId[]) => void;
  onTaskDeleted: (taskId: TaskId, fromColumnId: ColumnId) => void;
  indexFromPointer: (listEl: HTMLElement, clientY: number) => number;
}
