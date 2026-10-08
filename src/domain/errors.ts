export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: "unauthorized" | "validation" | "not_found" | "conflict",
  ) {
    super(message);
    this.name = "DomainError";
  }
}
