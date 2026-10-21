import type { Asset, UploadSession } from "@kenmark/storage-contracts";

export interface BrowserUploadOptions {
  session: UploadSession;
  file: Blob;
  signal?: AbortSignal;
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
}

export function uploadWithSession(options: BrowserUploadOptions): Promise<Asset> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Upload aborted", "AbortError"));
      return;
    }
    const expectedSize = Number(options.session.requiredHeaders["X-Kenmark-Upload-Size"]);
    if (!Number.isSafeInteger(expectedSize) || expectedSize !== options.file.size) {
      reject(new Error("The selected file size does not match the reserved upload session"));
      return;
    }
    const request = new XMLHttpRequest();
    request.open("PUT", options.session.uploadUrl);
    for (const [name, value] of Object.entries(options.session.requiredHeaders)) {
      request.setRequestHeader(name, value);
    }
    request.setRequestHeader("Authorization", `Upload ${options.session.uploadToken}`);
    request.setRequestHeader("Content-Type", "application/octet-stream");

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      options.onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percentage: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
      });
    });

    request.addEventListener("load", () => {
      let body: unknown;
      try {
        body = request.responseText ? JSON.parse(request.responseText) : {};
      } catch {
        body = {};
      }
      if (request.status >= 200 && request.status < 300) {
        resolve(body as Asset);
      } else {
        const response = body as { error?: { code?: string; message?: string } };
        reject(
          new Error(
            response.error?.message ?? `Upload failed with HTTP ${request.status || "unknown"}`,
          ),
        );
      }
    });
    request.addEventListener("error", () => reject(new Error("Upload network error")));
    request.addEventListener("abort", () => reject(new DOMException("Upload aborted", "AbortError")));

    const abort = (): void => request.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    request.addEventListener("loadend", () => options.signal?.removeEventListener("abort", abort));
    request.send(options.file);
  });
}
