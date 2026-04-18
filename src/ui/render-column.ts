import { allowDrop, getDragPayload } from "../drag";
import { qs, qsStrict } from "./dom";
import { renderTask } from "./render-task";
import { WIP_PRESETS } from "./board-utils";
import type { RenderColumnOptions } from "./contracts";

export function renderColumn({
  board,
  column,
  matchesFilters,
  selectedTasks,
  onTaskClick,
  onRender,
  onColumnDeleted,
  onTaskDeleted,
  indexFromPointer,
}: RenderColumnOptions): HTMLElement {
  const template = qsStrict<HTMLTemplateElement>("#template-column");
  const node = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;

  node.dataset.column = column.id;

  const titleInput = qsStrict<HTMLInputElement>(".column-title", node);
  const wipBadge = qsStrict<HTMLSpanElement>(".wip-badge", node);
  const setWipBtn = qsStrict<HTMLButtonElement>(".set-wip-btn", node);
  const delBtn = qsStrict<HTMLButtonElement>(".del-column-btn", node);
  const addTaskBtn = qsStrict<HTMLButtonElement>(".add-task-btn", node);
  const list = qsStrict<HTMLElement>(".task-list", node);
  const emptyDropzone = qs<HTMLElement>(".empty-dropzone", node);
  const dropIndicator = qs<HTMLElement>(".drop-indicator", node);

  titleInput.value = column.title;
  titleInput.addEventListener("input", () => {
    board.columns.update(column.id, { title: titleInput.value });
  });

  const paintWip = () => {
    const columnNow = board.columns.read(column.id);
    const count = columnNow?.taskIds.length ?? 0;
    const limit = board.columns.getWipLimit(column.id);
    const text = `${count}/${limit === null ? "∞" : limit}`;

    wipBadge.textContent = text;
    wipBadge.title = `WIP: ${text}\nClick to cycle • Shift+Click to set exact`;
    node.classList.toggle("wip-full", limit !== null && count >= limit);
  };

  const applyLimit = (value: number | null) => {
    board.columns.setWipLimit(column.id, value);
    paintWip();
  };

  const updateDropIndicator = (clientY: number) => {
    if (!dropIndicator) return;

    const taskCards = Array.from(
      list.querySelectorAll<HTMLElement>(".kan-task"),
    );

    if (taskCards.length === 0) {
      dropIndicator.style.top = "12px";
      return;
    }

    for (let i = 0; i < taskCards.length; i++) {
      const card = taskCards[i];
      if (!card) continue;

      const rect = card.getBoundingClientRect();
      const halfway = rect.top + rect.height / 2;

      if (clientY < halfway) {
        const top = card.offsetTop - 6;
        dropIndicator.style.top = `${Math.max(top, 8)}px`;
        return;
      }
    }

    const lastCard = taskCards[taskCards.length - 1];
    if (!lastCard) return;

    const top = lastCard.offsetTop + lastCard.offsetHeight + 6;
    dropIndicator.style.top = `${top}px`;
  };

  const clearDropState = () => {
    list.classList.remove("drop-target");
    node.classList.remove("column-drop-target");

    if (dropIndicator) {
      dropIndicator.style.opacity = "0";
    }
  };

  const showDropState = (clientY: number) => {
    list.classList.add("drop-target");
    node.classList.add("column-drop-target");

    if (dropIndicator) {
      updateDropIndicator(clientY);
      dropIndicator.style.opacity = "1";
    }
  };

  paintWip();
  wipBadge.tabIndex = 0;

  wipBadge.addEventListener("click", (event) => {
    const currentLimit = board.columns.getWipLimit(column.id);

    if (event.shiftKey) {
      const raw = prompt(
        `Set WIP limit for "${column.title}" (empty/0 = unlimited):`,
        currentLimit === null ? "" : String(currentLimit),
      );

      if (raw === null) return;

      const trimmed = raw.trim();
      if (!trimmed) {
        applyLimit(null);
        return;
      }

      const nextLimit = Number(trimmed);
      applyLimit(
        !Number.isFinite(nextLimit) || nextLimit <= 0
          ? null
          : Math.floor(nextLimit),
      );
      return;
    }

    const currentKey = currentLimit ?? null;
    const index = WIP_PRESETS.findIndex((value) => value === currentKey);
    const nextIndex = (index + 1) % WIP_PRESETS.length;
    const nextLimit = WIP_PRESETS[nextIndex] ?? null;
    applyLimit(nextLimit);
  });

  wipBadge.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key !== "enter" && key !== " ") return;
    event.preventDefault();

    const currentLimit = board.columns.getWipLimit(column.id);

    if (event.shiftKey) {
      const raw = prompt(
        `Set WIP limit for "${column.title}" (empty/0 = unlimited):`,
        currentLimit === null ? "" : String(currentLimit),
      );

      if (raw === null) return;

      const trimmed = raw.trim();
      if (!trimmed) {
        applyLimit(null);
        return;
      }

      const nextLimit = Number(trimmed);
      applyLimit(
        !Number.isFinite(nextLimit) || nextLimit <= 0
          ? null
          : Math.floor(nextLimit),
      );
      return;
    }

    const currentKey = currentLimit ?? null;
    const index = WIP_PRESETS.findIndex((value) => value === currentKey);
    const nextIndex = (index + 1) % WIP_PRESETS.length;
    const nextLimit = WIP_PRESETS[nextIndex] ?? null;
    applyLimit(nextLimit);
  });

  setWipBtn.addEventListener("click", () => {
    const currentLimit = board.columns.getWipLimit(column.id);
    const input = prompt(
      `Set WIP limit for "${column.title}" (empty or 0 = unlimited):`,
      currentLimit === null ? "" : String(currentLimit),
    );

    if (input === null) return;

    const trimmed = input.trim();
    const nextLimit = Number(input);
    const next =
      trimmed === "" ||
      nextLimit === 0 ||
      !Number.isFinite(nextLimit) ||
      nextLimit < 0
        ? null
        : Math.floor(nextLimit);

    board.columns.setWipLimit(column.id, next);
    paintWip();
  });

  delBtn.addEventListener("click", () => {
    if (!confirm(`Delete column "${column.title}"?`)) return;

    onColumnDeleted(column.id, [...column.taskIds]);
    board.columns.remove(column.id);
    onRender();
  });

  addTaskBtn.addEventListener("click", () => {
    if (board.columns.isFull(column.id)) {
      alert(
        `WIP limit reached for "${column.title}". Finish or move a task first.`,
      );
      return;
    }

    const title = prompt("Task title?");
    if (!title) return;

    const taskId = board.createTask(title);
    board.columns.addTask(column.id, taskId);
    onRender();
  });

  list.addEventListener("dragover", (event) => {
    const types = event.dataTransfer?.types ?? [];
    if (!types.includes("application/x-kanban")) return;

    let fromColumnId: string | null = null;
    const raw = event.dataTransfer?.getData("application/x-kanban");

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { fromColumnId?: string };
        fromColumnId = parsed.fromColumnId ?? null;
      } catch {
        fromColumnId = null;
      }
    }

    const fromSame = fromColumnId === column.id;
    if (!fromSame && board.columns.isFull(column.id)) return;

    allowDrop(event);
    showDropState(event.clientY);
  });

  list.addEventListener("dragleave", (event) => {
    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && list.contains(relatedTarget)) return;

    clearDropState();
  });

  list.addEventListener("drop", (event) => {
    event.preventDefault();
    clearDropState();

    const payload = getDragPayload(event);
    if (!payload) return;

    const fromSame = payload.fromColumnId === column.id;
    if (!fromSame && board.columns.isFull(column.id)) {
      alert(
        `WIP limit reached for "${column.title}". Finish or move a task first.`,
      );
      return;
    }

    const destinationIndex = indexFromPointer(list, event.clientY);

    board.columns.moveTask(
      payload.fromColumnId,
      column.id,
      payload.taskId,
      destinationIndex,
    );

    onRender();
  });

  node.addEventListener("dragend", () => {
    clearDropState();
  });

  const currentColumn = board.columns.read(column.id);
  if (currentColumn) {
    for (const taskId of currentColumn.taskIds) {
      if (!matchesFilters(taskId)) continue;

      const taskEl = renderTask({
        board,
        taskId,
        fromColumnId: column.id,
        selectedTasks,
        onTaskClick,
        onRender,
        onTaskDeleted,
      });

      if (emptyDropzone) {
        list.insertBefore(taskEl, emptyDropzone);
      } else {
        list.appendChild(taskEl);
      }
    }
  }

  const badge = qs<HTMLSpanElement>(".wip-badge", node);
  const count = currentColumn?.taskIds.length ?? 0;
  const limit = board.columns.getWipLimit(column.id);

  if (badge) {
    badge.textContent = `${count}/${limit === null ? "∞" : limit}`;
  }

  node.classList.toggle("wip-full", limit !== null && count >= limit);

  const visibleTaskCount = list.querySelectorAll(".kan-task").length;

  if (emptyDropzone) {
    emptyDropzone.classList.toggle("hidden", visibleTaskCount > 0);
  }

  if (dropIndicator) {
    dropIndicator.style.opacity = "0";
  }

  return node;
}
