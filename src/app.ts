import { Board } from "./store";
import { loadState, saveState } from "./storage";
import {
  BoardState,
  ThemeName,
  TaskId,
  ColumnId,
  asTaskId,
  asColumnId,
  uid,
} from "./types.js";

export function mergeBoardStates(
  base: BoardState,
  imported: BoardState,
): BoardState {
  const next: BoardState = {
    theme: base.theme,
    tasks: { ...base.tasks },
    columns: [...base.columns],
  };

  const taskIdMap = new Map<TaskId, TaskId>();
  const columnIdMap = new Map<ColumnId, ColumnId>();

  for (const [rawId, task] of Object.entries(imported.tasks)) {
    const oldId = rawId as TaskId;
    const newId = asTaskId(uid("tsk"));
    taskIdMap.set(oldId, newId);
    next.tasks[newId] = { ...task, id: newId };
  }

  for (const column of imported.columns) {
    const newColumnId = asColumnId(uid("col"));
    columnIdMap.set(column.id, newColumnId);

    const remappedTasks = column.taskIds.map((oldTid) => {
      const mapped = taskIdMap.get(oldTid);
      return mapped ?? asTaskId(uid("tsk-missing"));
    });

    next.columns.push({
      ...column,
      id: newColumnId,
      taskIds: remappedTasks,
    });
  }

  return next;
}

export function initBoard(): Board {
  const saved = loadState() as BoardState | null;
  if (saved) {
    const rawTheme = (saved.theme as string)?.toLowerCase();
    const allowedThemes: ThemeName[] = [
      "sky",
      "grape",
      "slate",
      "sunset",
      "forest",
      "ocean",
      "sand",
      "rose",
    ];
    saved.theme = (
      allowedThemes.includes(rawTheme as ThemeName) ? rawTheme : "sky"
    ) as ThemeName;
  }
  return new Board(saved ?? undefined);
}
