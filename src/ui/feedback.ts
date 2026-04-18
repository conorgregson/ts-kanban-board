import { qs } from "./dom";

export function showToast(
  message: string,
  variant: "success" | "error" | "info" = "info",
  timeoutMs = 2800,
): void {
  const root =
    qs<HTMLDivElement>("#toast") ??
    (() => {
      const element = document.createElement("div");
      element.id = "toast";
      element.className = "fixed bottom-4 right-4 flex flex-col gap-2 z-50";
      document.body.appendChild(element);
      return element;
    })();

  const toastElement = document.createElement("div");
  toastElement.className = `toast toast--${variant}`;
  toastElement.textContent = message;

  root.appendChild(toastElement);

  const remove = () => {
    if (toastElement.parentElement) {
      toastElement.parentElement.removeChild(toastElement);
    }
  };

  toastElement.addEventListener("click", remove);
  window.setTimeout(remove, timeoutMs);
}
