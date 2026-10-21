import type {
  Asset,
  AssetList,
  CreateUploadInput,
  ListAssetsQuery,
  SignedUrlRequest,
  SignedUrlResponse,
  UpdateAssetInput,
  UploadSession,
} from "@kenmark/storage-contracts";
import { KenmarkStorageError } from "./error.js";

export interface KenmarkStorageOptions {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof globalThis.fetch;
}

function queryString(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export class KenmarkStorage {
  readonly #baseUrl: string;
  readonly #apiKey: string;
  readonly #fetch: typeof globalThis.fetch;

  constructor(options: KenmarkStorageOptions) {
    if (!options.baseUrl) throw new TypeError("KenmarkStorage baseUrl is required");
    if (!options.apiKey) throw new TypeError("KenmarkStorage apiKey is required");
    this.#baseUrl = new URL(options.baseUrl).toString().replace(/\/$/, "");
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (!this.#fetch) throw new TypeError("A fetch implementation is required");
  }

  async #request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.#apiKey}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) throw await KenmarkStorageError.fromResponse(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  readonly uploads = {
    create: async (input: CreateUploadInput): Promise<UploadSession> =>
      this.#request<UploadSession>("/v1/uploads", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  };

  readonly assets = {
    get: async (assetId: string): Promise<Asset> =>
      this.#request<Asset>(`/v1/assets/${encodeURIComponent(assetId)}`),

    list: async (query: ListAssetsQuery = {}): Promise<AssetList> =>
      this.#request<AssetList>(`/v1/assets${queryString(query as Record<string, unknown>)}`),

    update: async (assetId: string, input: UpdateAssetInput): Promise<Asset> =>
      this.#request<Asset>(`/v1/assets/${encodeURIComponent(assetId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    signedUrl: async (assetId: string, input: SignedUrlRequest = {}): Promise<SignedUrlResponse> =>
      this.#request<SignedUrlResponse>(
        `/v1/assets/${encodeURIComponent(assetId)}/signed-url`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),

    delete: async (assetId: string): Promise<void> =>
      this.#request<void>(`/v1/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" }),

    restore: async (assetId: string): Promise<Asset> =>
      this.#request<Asset>(`/v1/assets/${encodeURIComponent(assetId)}/restore`, {
        method: "POST",
      }),
  };
}
