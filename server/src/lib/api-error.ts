/**
 * Typed application error carrying an explicit HTTP status.
 * Throw this from any service/controller for an expected, business-rule
 * rejection (not found, forbidden, duplicate, etc.) — `error-handler.ts`
 * maps it straight to the matching HTTP response. Anything else thrown
 * is treated as an unexpected 500.
 */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
