import type { Task } from "../types";
import { setDragPayload } from "../drag";
import { qsStrict } from "./dom";
import { renderLabelEditorChips, renderTaskLabels } from "./labels";
import type { RenderTaskOptions } from "./contracts";

export function renderTask({
  board,
  taskId,
  fromColumnId,
  selectedTasks,
  onTaskClick,
  onRender,
  onTaskDeleted,
}: RenderTaskOptions): HTMLElement {
  const task = board.tasks.read(taskId);
  if (!task) throw new Error("Ghost task");

  const template = qsStrict<HTMLTemplateElement>("#template-task");
  const node = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;

  const titleEl = qsStrict<HTMLElement>(".task-title", node);
  const metaEl = qsStrict<HTMLElement>(".task-meta", node);
  const labelsEl = qsStrict<HTMLElement>(".task-labels", node);
  const editLabelsBtn = qsStrict<HTMLButtonElement>(".edit-labels-btn", node);
  const editorEl = qsStrict<HTMLElement>(".label-editor", node);
  const chipsContainer = qsStrict<HTMLElement>(".label-editor-chips", node);
  const inputEl = qsStrict<HTMLInputElement>(".label-editor-input", node);
  const saveBtn = qsStrict<HTMLButtonElement>(".label-editor-save", node);

  node.dataset.task = taskId;

  titleEl.textContent = task.title;
  const created = new Date(task.createdAt).toLocaleString();
  metaEl.textContent = `Created ${created}`;

  const currentLabels = new Set<string>(
    (task.labels ?? []).map((label) => label.trim()).filter(Boolean),
  );

  renderTaskLabels(labelsEl, Array.from(currentLabels));

  if (selectedTasks.has(taskId)) {
    node.classList.add("kan-task--selected");
  }

  const refreshEditor = () => {
    renderLabelEditorChips(chipsContainer, currentLabels);
    inputEl.value = "";
  };

  const toggleEditor = () => {
    const isHidden = editorEl.classList.contains("hidden");

    if (isHidden) {
      refreshEditor();
      editorEl.classList.remove("hidden");
    } else {
      editorEl.classList.add("hidden");
    }
  };

  editLabelsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleEditor();
  });

  saveBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    const extraRaw = inputEl.value.trim();
    if (extraRaw) {
      for (const part of extraRaw.split(",")) {
        const label = part.trim();
        if (label) {
          currentLabels.add(label);
        }
      }
    }

    const nextLabels = Array.from(currentLabels);

    const targetIds = selectedTasks.has(taskId)
      ? Array.from(selectedTasks)
      : [taskId];

    for (const id of targetIds) {
      board.tasks.update(id, {
        labels: nextLabels,
      } as Partial<Task>);
    }

    editorEl.classList.add("hidden");
    onRender();
  });

  node.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest(".label-editor")) return;
    onTaskClick(event, taskId, fromColumnId);
  });

  node.addEventListener("dragstart", (event) => {
    node.classList.add("drag-preview");
    setDragPayload(event as DragEvent, { taskId, fromColumnId });
  });

  node.addEventListener("dragend", () => {
    node.classList.remove("drag-preview");
  });

  node.addEventListener("dblclick", () => {
    const currentTask = board.tasks.read(taskId);
    if (!currentTask) return;

    const next = prompt("Rename task:", currentTask.title);
    if (!next || next === currentTask.title) return;

    board.tasks.update(taskId, { title: next } as Partial<Task>);
    onRender();
  });

  node.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    const currentTask = board.tasks.read(taskId);
    if (!currentTask) return;

    if (!confirm(`Delete "${currentTask.title}"?`)) return;

    board.columns.removeTask(fromColumnId, taskId);
    board.tasks.remove(taskId);
    onTaskDeleted(taskId, fromColumnId);
    onRender();
  });

  return node;
}
