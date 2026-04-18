import {
  BoardState,
  Column,
  ColumnId,
  Task,
  TaskId,
  ThemeName,
  asColumnId,
  asTaskId,
  uid,
  isFiniteNonNegative,
} from "./types";
import { saveState } from "./storage";

function makeColumn<C extends Column>(
  title: string,
  wipLimit?: number | null,
): C {
  const base = {
    id: asColumnId(uid("column")),
    title,
    taskIds: [] as TaskId[],
  };
  const column = (
    isFiniteNonNegative(wipLimit)
      ? { ...base, wipLimit: Math.floor(wipLimit!) }
      : base
  ) as C;
  return column;
}

export interface Repo<TItem, TId extends string> {
  create(item: TItem): void;
  read(id: TId): TItem | undefined;
  update(id: TId, patch: Partial<TItem>): void;
  remove(id: TId): void;
}

export class Board<C extends Column = Column, T extends Task = Task> {
  private state: BoardState<C, T>;

  constructor(initial?: BoardState<C, T>) {
    this.state = initial ?? {
      theme: "sky",
      tasks: {} as Record<TaskId, T>,
      columns: [
        makeColumn<C>("Backlog"),
        makeColumn<C>("In Progress"),
        makeColumn<C>("Done"),
      ],
    };
    saveState(this.state);
  }

  get snapshot(): BoardState<C, T> {
    return this.state;
  }

  setTheme(theme: ThemeName) {
    this.state.theme = theme;
    saveState(this.state);
  }

  private limitOf(column: Column): number | null {
    return isFiniteNonNegative(column.wipLimit)
      ? Math.floor(column.wipLimit!)
      : null;
  }

  private isFull(column: Column): boolean {
    const limit = this.limitOf(column);
    return limit !== null && column.taskIds.length >= limit;
  }

  tasks: Repo<T, TaskId> = {
    create: (task: T) => {
      this.state.tasks[task.id] = task;
      saveState(this.state);
    },
    read: (id) => this.state.tasks[id],
    update: (id, patch) => {
      const taskId = this.state.tasks[id];
      if (!taskId) return;
      this.state.tasks[id] = { ...taskId, ...patch };
      saveState(this.state);
    },
    remove: (id) => {
      delete this.state.tasks[id];
      saveState(this.state);
    },
  };

  columns: Repo<C, ColumnId> & {
    createEmpty(title: string, wipLimit?: number | null): ColumnId;
    setWipLimit(columnId: ColumnId, limit: number | null | undefined): void;
    getWipLimit(columnId: ColumnId): number | null;
    isFull(columnId: ColumnId): boolean;
    addTask(columnId: ColumnId, taskId: TaskId, index?: number): void;
    moveTask(
      sourceColumn: ColumnId,
      destinationColumn: ColumnId,
      taskId: TaskId,
      destinationIndex?: number,
    ): void;
    removeTask(columnId: ColumnId, taskId: TaskId): void;
  } = {
    create: (column: C) => {
      this.state.columns.push(column);
      saveState(this.state);
    },
    read: (id) => this.state.columns.find((columnItem) => columnItem.id === id),
    update: (id, patch) => {
      const column = this.state.columns.find(
        (columnItem) => columnItem.id === id,
      );
      if (!column) return;
      Object.assign(column, patch);
      saveState(this.state);
    },
    remove: (id) => {
      this.state.columns = this.state.columns.filter((c) => c.id !== id);
      saveState(this.state);
    },

    createEmpty: (title, wipLimit) => {
      const column = makeColumn<C>(title, wipLimit);
      this.state.columns.push(column);
      saveState(this.state);
      return column.id;
    },

    setWipLimit: (columnId, limit) => {
      const column = this.columns.read(columnId);
      if (!column) return;

      column.wipLimit = isFiniteNonNegative(limit) ? Math.floor(limit) : null;

      saveState(this.state);
    },

    getWipLimit: (columnId) => {
      const column = this.columns.read(columnId);
      if (!column) return null;
      return this.limitOf(column);
    },

    isFull: (columnId) => {
      const column = this.columns.read(columnId);
      if (!column) return false;
      return this.isFull(column);
    },

    addTask: (columnId, taskId, index) => {
      const column = this.columns.read(columnId);
      if (!column) return;

      if (index == undefined || index < 0 || index > column.taskIds.length) {
        column.taskIds.push(taskId);
      } else {
        column.taskIds.splice(index, 0, taskId);
      }
      saveState(this.state);
    },
    moveTask: (
      sourceColumnId,
      destinationColumnId,
      taskId,
      destinationIndex,
    ) => {
      const source = this.columns.read(sourceColumnId);
      if (!source) return;

      const destination = this.columns.read(destinationColumnId);
      if (!destination) return;

      const between = sourceColumnId !== destinationColumnId;
      if (between && this.isFull(destination)) return;

      const index = source.taskIds.indexOf(taskId);
      if (index < 0) return;

      source.taskIds.splice(index, 1);

      if (
        destinationIndex === undefined ||
        destinationIndex < 0 ||
        destinationIndex > destination.taskIds.length
      ) {
        destination.taskIds.push(taskId);
      } else {
        destination.taskIds.splice(destinationIndex, 0, taskId);
      }

      saveState(this.state);
    },

    removeTask: (columnId, taskId) => {
      const column = this.columns.read(columnId);
      if (!column) return;
      column.taskIds = column.taskIds.filter((id) => id !== taskId);
      saveState(this.state);
    },
  };

  createTask(title: string): TaskId {
    const base: Task = {
      id: asTaskId(uid("tsk")),
      title,
      createdAt: Date.now(),
      labels: [],
    };
    const task = base as T;
    this.tasks.create(task);
    return task.id;
  }
}
