export function restoreFields(form: HTMLFormElement, values: Record<string, string | readonly string[]>) {
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    const value = values[element.name];
    if (value === undefined) continue;
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      element.checked = Array.isArray(value) ? value.includes(element.value) : value === element.value;
      continue;
    }
    if (typeof value === "string") element.value = value;
  }
}
