export function qs<T extends Element>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector(selector) as T | null;
}

export function qsStrict<T extends Element>(
  selector: string,
  root: ParentNode = document,
): T {
  const element = qs<T>(selector, root);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
