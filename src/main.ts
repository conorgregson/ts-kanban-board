import { initBoard } from "./app";
import { UI } from "./ui/index";

function boot() {
  const board = initBoard();
  const ui = new UI(board);
  ui.mount();
  ui.startAutoBackup();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
