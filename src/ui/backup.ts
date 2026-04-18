import { loadBackupInfo } from "../storage";

export function formatAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;

  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function updateBackupStatusUI(
  restoreBackupBtn: HTMLButtonElement,
  statusEl: HTMLElement | null,
): void {
  if (!statusEl) return;

  const info = loadBackupInfo();

  if (!info) {
    restoreBackupBtn.disabled = true;
    statusEl.textContent = "No backup yet";
    return;
  }

  restoreBackupBtn.disabled = false;
  const ageMs = Date.now() - info.savedAt;
  statusEl.textContent = `Backed up ${formatAge(ageMs)}`;
}
