import type { ErrorResponse } from "@kenmark/storage-contracts";

export class KenmarkStorageError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "KenmarkStorageError";
  }

  static async fromResponse(response: Response): Promise<KenmarkStorageError> {
    try {
      const payload = (await response.json()) as ErrorResponse;
      return new KenmarkStorageError(
        response.status,
        payload.error?.code ?? "HTTP_ERROR",
        payload.error?.message ?? response.statusText,
        payload.error?.details,
      );
    } catch {
      return new KenmarkStorageError(response.status, "HTTP_ERROR", response.statusText);
    }
  }
}
