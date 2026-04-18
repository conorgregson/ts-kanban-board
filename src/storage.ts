import { BoardState } from "./types";

const STORAGE_KEY = "kanban-ts@v1";
const BACKUP_KEY = "kanban-backup@v1";

export interface BackupEnvelope {
  state: BoardState;
  savedAt: number;
}

export function saveState(state: BoardState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState(): BoardState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BoardState;
  } catch {
    return null;
  }
}

export function resetState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveBackup(state: BoardState): void {
  try {
    const envelope: BackupEnvelope = {
      state,
      savedAt: Date.now(),
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(envelope));
  } catch {
    // ignore backup failures
  }
}

export function loadBackup(): BoardState | null {
  const raw = localStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackupEnvelope | BoardState;
    if ("state" in parsed && "savedAt" in parsed) {
      return (parsed as BackupEnvelope).state;
    }
    return parsed as BoardState;
  } catch {
    return null;
  }
}

export function loadBackupInfo(): BackupEnvelope | null {
  const raw = localStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackupEnvelope | BoardState;
    if ("state" in parsed && "savedAt" in parsed) {
      return parsed as BackupEnvelope;
    }
    return {
      state: parsed as BoardState,
      savedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function downloadJSON(state: BoardState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  downloadLink.download = `kanban-board-${ts}.json`;
  downloadLink.click();
  URL.revokeObjectURL(url);
}

export async function readJSONFile(file: File): Promise<BoardState> {
  const text = await file.text();
  return JSON.parse(text) as BoardState;
}
