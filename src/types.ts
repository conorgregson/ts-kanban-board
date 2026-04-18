type Brand<T, B extends string> = T & { __brand: B };
export type ColumnId = Brand<string, "ColumnId">;
export type TaskId = Brand<string, "TaskId">;

export interface Task {
  id: TaskId;
  title: string;
  createdAt: number;
  labels?: string[];
}

export interface Column {
  id: ColumnId;
  title: string;
  taskIds: TaskId[];
  wipLimit?: number | null;
}

export interface BoardState<C extends Column = Column, T extends Task = Task> {
  columns: C[];
  tasks: Record<TaskId, T>;
  theme: ThemeName;
}

export type ThemeName =
  | "sky"
  | "grape"
  | "slate"
  | "sunset"
  | "forest"
  | "ocean"
  | "sand"
  | "rose";

export type TaskLabel = string;

export function asColumnId(rawId: string): ColumnId {
  return rawId as ColumnId;
}
export function asTaskId(rawId: string): TaskId {
  return rawId as TaskId;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value >= 0;
}
