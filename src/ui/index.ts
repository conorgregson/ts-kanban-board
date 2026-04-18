import { Board } from "../store";
import { ColumnId, TaskId } from "../types";
import {
  saveBackup,
  saveState,
  downloadJSON,
  loadBackup,
  readJSONFile,
} from "../storage";
import { mergeBoardStates } from "../app";
import { qs, qsStrict } from "./dom";
import { showToast } from "./feedback";
import { renderColumn } from "./render-column";
import {
  clearSelection,
  handleTaskSelection,
  removeColumnTasksFromSelection,
  removeTaskFromSelection,
} from "./selection";
import {
  bulkClearSelection,
  bulkDelete,
  bulkEditLabels,
  bulkMoveToColumn,
  updateBulkActionsBar,
} from "./bulk-actions";
import { applyThemeFromBoard, bindThemeChange } from "./theme";
import {
  createFilterState,
  clearFilters,
  matchesFilters,
  renderFiltersUI,
} from "./filters";
import { updateBackupStatusUI } from "./backup";
import { findTaskCard, findTaskColumn, indexFromPointer } from "./board-utils";
import type { BulkActionsContext, SelectionState } from "./contracts";

export class UI {
  private backupTimerId: number | null = null;

  private selection: SelectionState = {
    selectedTasks: new Set<TaskId>(),
    lastSelectedTask: null,
  };

  private filters = createFilterState();

  private isBound = false;

  private dragScrollRafId: number | null = null;
  private dragScrollDirection = 0;

  private themeSelect!: HTMLSelectElement;
  private boardEl!: HTMLElement;
  private addColumnBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private importBtn!: HTMLButtonElement;
  private importInput!: HTMLInputElement;
  private restoreBackupBtn!: HTMLButtonElement;
  private backupStatusEl!: HTMLElement;

  private filterTextInput!: HTMLInputElement;
  private filterLabelsEl!: HTMLElement;
  private filterClearBtn!: HTMLButtonElement;

  private bulkBar!: HTMLElement;
  private bulkCountEl!: HTMLElement;
  private bulkClearBtn!: HTMLButtonElement;
  private bulkDeleteBtn!: HTMLButtonElement;
  private bulkLabelBtn!: HTMLButtonElement;
  private bulkMoveSelect!: HTMLSelectElement;

  constructor(private board: Board) {}

  mount() {
    this.cacheDomRefs();

    if (!this.isBound) {
      this.bindStaticEvents();
      this.isBound = true;
    }

    this.render();
    this.maybeShowGettingStartedTips();
  }

  startAutoBackup(intervalMs = 180_000) {
    if (this.backupTimerId !== null) return;

    this.backupTimerId = window.setInterval(() => {
      saveBackup(this.board.snapshot);
      this.updateBackupStatus();
    }, intervalMs);
  }

  stopAutoBackup() {
    if (this.backupTimerId !== null) {
      window.clearInterval(this.backupTimerId);
      this.backupTimerId = null;
    }
  }

  private maybeShowGettingStartedTips() {
    const key = "kanban-tips-shown";
    if (localStorage.getItem(key) === "1") return;

    showToast("Tip: Double-click a task to rename it.", "info", 3600);

    window.setTimeout(() => {
      showToast("Tip: Ctrl-click a second task to multi-select.", "info", 4200);
    }, 900);

    localStorage.setItem(key, "1");
  }

  private startBoardAutoScroll() {
    if (this.dragScrollRafId !== null) return;

    const tick = () => {
      if (this.dragScrollDirection !== 0) {
        this.boardEl.scrollLeft += this.dragScrollDirection * 12;
        this.dragScrollRafId = window.requestAnimationFrame(tick);
      } else {
        this.dragScrollRafId = null;
      }
    };

    this.dragScrollRafId = window.requestAnimationFrame(tick);
  }

  private stopBoardAutoScroll() {
    this.dragScrollDirection = 0;

    if (this.dragScrollRafId !== null) {
      window.cancelAnimationFrame(this.dragScrollRafId);
      this.dragScrollRafId = null;
    }
  }

  private updateBoardAutoScroll(clientX: number) {
    const rect = this.boardEl.getBoundingClientRect();
    const edgeThreshold = 72;

    const nearLeft = clientX < rect.left + edgeThreshold;
    const nearRight = clientX > rect.right - edgeThreshold;

    if (nearLeft) {
      this.dragScrollDirection = -1;
      this.startBoardAutoScroll();
      return;
    }

    if (nearRight) {
      this.dragScrollDirection = 1;
      this.startBoardAutoScroll();
      return;
    }

    this.stopBoardAutoScroll();
  }

  private cacheDomRefs() {
    this.themeSelect = qsStrict<HTMLSelectElement>("#theme-select");
    this.boardEl = qsStrict<HTMLElement>("#board");
    this.addColumnBtn = qsStrict<HTMLButtonElement>("#add-column-btn");
    this.resetBtn = qsStrict<HTMLButtonElement>("#reset-btn");
    this.exportBtn = qsStrict<HTMLButtonElement>("#export-btn");
    this.importBtn = qsStrict<HTMLButtonElement>("#import-btn");
    this.importInput = qsStrict<HTMLInputElement>("#import-file");
    this.restoreBackupBtn = qsStrict<HTMLButtonElement>("#restore-backup-btn");
    this.backupStatusEl = qsStrict<HTMLElement>("#backup-status");

    this.filterTextInput = qsStrict<HTMLInputElement>("#filter-text");
    this.filterLabelsEl = qsStrict<HTMLElement>("#filter-labels");
    this.filterClearBtn = qsStrict<HTMLButtonElement>("#filter-clear-btn");

    this.bulkBar = qsStrict<HTMLElement>("#bulk-actions");
    this.bulkCountEl = qsStrict<HTMLElement>("#bulk-count");
    this.bulkClearBtn = qsStrict<HTMLButtonElement>("#bulk-clear");
    this.bulkDeleteBtn = qsStrict<HTMLButtonElement>("#bulk-delete");
    this.bulkLabelBtn = qsStrict<HTMLButtonElement>("#bulk-label");
    this.bulkMoveSelect = qsStrict<HTMLSelectElement>("#bulk-move");
  }

  private bindStaticEvents() {
    bindThemeChange(() => this.board, this.themeSelect);

    this.boardEl.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".kan-task")) {
        clearSelection(this.selection);
        this.refreshSelectionUI();
      }
    });

    this.boardEl.addEventListener("dragover", (event) => {
      this.updateBoardAutoScroll(event.clientX);
    });

    this.boardEl.addEventListener("drop", () => {
      this.stopBoardAutoScroll();
    });

    this.boardEl.addEventListener("dragleave", (event) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && this.boardEl.contains(relatedTarget)) return;
      this.stopBoardAutoScroll();
    });

    document.addEventListener("dragend", () => {
      this.stopBoardAutoScroll();
    });

    this.addColumnBtn.addEventListener("click", () => {
      const name = prompt("New column title?", "New Column");
      if (!name) return;

      const columnId = this.board.columns.createEmpty(name);
      this.render();

      const columnTitleInput = qs<HTMLInputElement>(
        `[data-column="${columnId}"] .column-title`,
        this.boardEl,
      );
      columnTitleInput?.focus();
    });

    this.resetBtn.addEventListener("click", () => {
      if (!confirm("Reset the board to empty?")) return;
      localStorage.clear();
      location.reload();
    });

    this.exportBtn.addEventListener("click", () => {
      downloadJSON(this.board.snapshot);
    });

    this.importBtn.addEventListener("click", () => {
      this.importInput.click();
    });

    this.importInput.addEventListener("change", async () => {
      const file = this.importInput.files?.[0];
      if (!file) return;

      try {
        const imported = await readJSONFile(file);

        const statsMessage =
          `File: ${file.name}\n` +
          `Columns: ${imported.columns.length}\n` +
          `Tasks: ${Object.keys(imported.tasks).length}`;

        const doMerge = confirm(
          `${statsMessage}\n\n` +
            "OK = MERGE (append imported columns to current board)\n" +
            "Cancel = REPLACE current board with imported data",
        );

        saveBackup(this.board.snapshot);
        this.updateBackupStatus();

        if (doMerge) {
          const merged = mergeBoardStates(this.board.snapshot, imported);
          saveState(merged);
          this.board = new Board(merged);
          showToast("Board merged successfully.", "success");
        } else {
          saveState(imported);
          this.board = new Board(imported);
          showToast("Board imported (replaced current).", "success");
        }

        clearSelection(this.selection);
        this.render();
      } catch (error) {
        console.error(error);
        showToast("Invalid or corrupted JSON file.", "error");
      } finally {
        this.importInput.value = "";
      }
    });

    this.restoreBackupBtn.addEventListener("click", () => {
      const backup = loadBackup();
      if (!backup) {
        showToast("No backup found.", "info");
        return;
      }

      const ok = confirm(
        "Restore the last backup? This will replace your current board state.",
      );
      if (!ok) return;

      saveState(backup);
      this.board = new Board(backup);
      clearSelection(this.selection);
      this.updateBackupStatus();
      showToast("Restored board from last backup.", "success");
      this.render();
    });

    this.filterTextInput.addEventListener("input", () => {
      this.filters.text = this.filterTextInput.value;
      this.render();
    });

    this.filterClearBtn.addEventListener("click", () => {
      clearFilters(this.filters);
      this.render();
    });

    this.bulkClearBtn.addEventListener("click", () => {
      bulkClearSelection(this.getBulkActionsContext());
    });

    this.bulkDeleteBtn.addEventListener("click", () => {
      bulkDelete(this.getBulkActionsContext());
    });

    this.bulkLabelBtn.addEventListener("click", () => {
      bulkEditLabels(this.getBulkActionsContext());
    });

    this.bulkMoveSelect.addEventListener("change", () => {
      const destinationColumnId = this.bulkMoveSelect.value as ColumnId;
      if (!destinationColumnId) return;

      bulkMoveToColumn(this.getBulkActionsContext(), destinationColumnId);
      this.bulkMoveSelect.value = "";
    });
  }

  private getBulkActionsContext(): BulkActionsContext {
    return {
      board: this.board,
      selection: this.selection,
      findTaskColumn: (taskId) => findTaskColumn(this.board, taskId),
      render: () => this.render(),
      openLabelEditorForTask: (taskId) => {
        const card = findTaskCard(taskId);
        if (!card) return;

        const button =
          card.querySelector<HTMLButtonElement>(".edit-labels-btn");
        button?.click();
      },
    };
  }

  private render() {
    applyThemeFromBoard(this.board, this.themeSelect);

    renderFiltersUI(
      this.filterTextInput,
      this.filterLabelsEl,
      this.filters,
      () => this.render(),
    );

    this.renderBoard(this.boardEl);
    this.refreshSelectionUI();
    this.updateBackupStatus();
    this.updateBulkActionsBar();
  }

  private updateBackupStatus() {
    updateBackupStatusUI(this.restoreBackupBtn, this.backupStatusEl);
  }

  private refreshSelectionUI() {
    const cards = document.querySelectorAll<HTMLElement>(".kan-task");

    cards.forEach((card) => {
      const id = card.dataset.task as TaskId | undefined;
      if (!id) return;

      card.classList.toggle(
        "kan-task--selected",
        this.selection.selectedTasks.has(id),
      );
    });

    this.updateBulkActionsBar();
  }

  private renderBoard(boardEl: HTMLElement) {
    boardEl.innerHTML = "";

    for (const column of this.board.snapshot.columns) {
      const columnEl = renderColumn({
        board: this.board,
        column,
        matchesFilters: (taskId) => {
          const task = this.board.tasks.read(taskId);
          return matchesFilters(this.filters, task);
        },
        selectedTasks: this.selection.selectedTasks,
        onTaskClick: (event, taskId, columnId) => {
          handleTaskSelection(
            this.board,
            this.selection,
            event,
            taskId,
            columnId,
          );
          this.refreshSelectionUI();
        },
        onRender: () => {
          this.render();
        },
        onColumnDeleted: (_columnId, taskIds) => {
          removeColumnTasksFromSelection(this.selection, taskIds);
        },
        onTaskDeleted: (taskId) => {
          removeTaskFromSelection(this.selection, taskId);
        },
        indexFromPointer,
      });

      boardEl.appendChild(columnEl);
      columnEl.classList.add("enter");

      window.setTimeout(() => {
        columnEl.classList.remove("enter");
      }, 220);
    }
  }

  private updateBulkActionsBar() {
    updateBulkActionsBar(
      this.bulkBar,
      this.bulkCountEl,
      this.bulkMoveSelect,
      this.selection.selectedTasks,
      this.board,
    );
  }
}
