import { ColumnId, TaskId } from "./types";

const MIME = "application/x-kanban";

export interface DragPayload {
  taskId: TaskId;
  fromColumnId: ColumnId;
}

export function setDragPayload(event: DragEvent, payload: DragPayload) {
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(MIME, JSON.stringify(payload));
}

export function getDragPayload(event: DragEvent): DragPayload | null {
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) return null;
  try {
    return JSON.parse(dataTransfer.getData(MIME)) as DragPayload;
  } catch {
    return null;
  }
}

export function allowDrop(event: DragEvent) {
  if (!event.dataTransfer) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}
