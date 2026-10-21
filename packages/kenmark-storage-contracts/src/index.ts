import { z } from "zod";
import { DEFAULT_ALLOWED_MIME_TYPES, isPlatformMimeAllowed, normalizeMimeType } from "./mime.js";

export * from "./mime.js";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
export const DEFAULT_PROJECT_QUOTA_BYTES = 100 * 1024 * 1024 * 1024;

export const VisibilitySchema = z.enum(["public", "private"]);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const ProcessingModeSchema = z.enum(["raw", "web"]);
export type ProcessingMode = z.infer<typeof ProcessingModeSchema>;

export const AssetStatusSchema = z.enum([
  "uploading",
  "processing",
  "ready",
  "processing_failed",
  "deleted",
]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

export const ApiKeyScopeSchema = z.enum([
  "assets:read",
  "assets:write",
  "assets:delete",
]);
export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  quotaBytes: z.number().int().nonnegative(),
  usedBytes: z.number().int().nonnegative(),
  reservedBytes: z.number().int().nonnegative(),
  derivativeBytes: z.number().int().nonnegative(),
  maxFileSizeBytes: z.number().int().positive(),
  defaultVisibility: VisibilitySchema,
  defaultProcessingMode: ProcessingModeSchema,
  allowedMimeTypes: z.array(z.string()),
  allowedOrigins: z.array(z.string()),
  disabledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

const ProjectNameSchema = z.string().trim().min(2).max(120);
const ProjectSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const ProjectQuotaSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const ProjectMaxFileSizeSchema = z.number().int().positive().max(MAX_FILE_SIZE_BYTES);
const AllowedMimeTypeSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => normalizeMimeType(value))
  .refine((value) => isPlatformMimeAllowed(value), {
    message: "This content type is not in the platform allowlist",
  });
const AllowedMimeTypesSchema = z.array(AllowedMimeTypeSchema);
const AllowedOriginsSchema = z.array(z.url().transform((value) => new URL(value).origin));

export const CreateProjectSchema = z.object({
  name: ProjectNameSchema,
  slug: ProjectSlugSchema,
  quotaBytes: ProjectQuotaSchema.default(DEFAULT_PROJECT_QUOTA_BYTES),
  maxFileSizeBytes: ProjectMaxFileSizeSchema.default(MAX_FILE_SIZE_BYTES),
  defaultVisibility: VisibilitySchema.default("private"),
  defaultProcessingMode: ProcessingModeSchema.default("raw"),
  allowedMimeTypes: AllowedMimeTypesSchema.default([...DEFAULT_ALLOWED_MIME_TYPES]),
  allowedOrigins: AllowedOriginsSchema.default([]),
});
export type CreateProjectInput = z.input<typeof CreateProjectSchema>;

// Do not derive this with CreateProjectSchema.partial(). Zod 4 applies nested
// defaults inside optional object fields, which can turn a narrow PATCH into an
// accidental reset of unrelated project settings.
export const UpdateProjectSchema = z
  .object({
    name: ProjectNameSchema.optional(),
    slug: ProjectSlugSchema.optional(),
    quotaBytes: ProjectQuotaSchema.optional(),
    maxFileSizeBytes: ProjectMaxFileSizeSchema.optional(),
    defaultVisibility: VisibilitySchema.optional(),
    defaultProcessingMode: ProcessingModeSchema.optional(),
    allowedMimeTypes: AllowedMimeTypesSchema.optional(),
    allowedOrigins: AllowedOriginsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one project field must be supplied",
  });
export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().trim().min(2).max(100),
  scopes: z.array(ApiKeyScopeSchema).min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const ApiKeySummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  prefix: z.string(),
  lastFour: z.string(),
  scopes: z.array(ApiKeyScopeSchema),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type ApiKeySummary = z.infer<typeof ApiKeySummarySchema>;

export const CreateUploadSchema = z.object({
  filename: z.string().trim().min(1).max(512),
  contentType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  visibility: VisibilitySchema.optional(),
  processingMode: ProcessingModeSchema.optional(),
  folder: z
    .string()
    .trim()
    .max(500)
    .regex(/^\/(?:[^/]+\/?)*$/)
    .default("/"),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
});
export type CreateUploadInput = z.input<typeof CreateUploadSchema>;

export const UploadSessionSchema = z.object({
  uploadId: z.string(),
  assetId: z.string(),
  uploadUrl: z.url(),
  uploadToken: z.string(),
  expiresAt: z.string().datetime(),
  requiredHeaders: z.record(z.string(), z.string()),
});
export type UploadSession = z.infer<typeof UploadSessionSchema>;

export const AssetVariantSchema = z.object({
  name: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  format: z.string().nullable(),
});
export type AssetVariant = z.infer<typeof AssetVariantSchema>;

export const AssetSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectSlug: z.string(),
  originalName: z.string(),
  contentType: z.string(),
  detectedContentType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  derivativeBytes: z.number().int().nonnegative(),
  sha256: z.string(),
  visibility: VisibilitySchema,
  processingMode: ProcessingModeSchema,
  status: AssetStatusSchema,
  folder: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  image: z
    .object({
      width: z.number().int().positive().nullable(),
      height: z.number().int().positive().nullable(),
      format: z.string().nullable(),
      pages: z.number().int().positive().nullable(),
    })
    .nullable(),
  variants: z.array(AssetVariantSchema),
  publicUrl: z.url().nullable(),
  processingError: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
  purgeAfter: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const UpdateAssetSchema = z.object({
  visibility: VisibilitySchema,
});
export type UpdateAssetInput = z.input<typeof UpdateAssetSchema>;

const QueryBooleanSchema = z.union([z.boolean(), z.enum(["true", "false", "1", "0"])]).transform((value) =>
  typeof value === "boolean" ? value : value === "true" || value === "1",
);

export const ListAssetsQuerySchema = z.object({
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  folder: z.string().optional(),
  status: AssetStatusSchema.optional(),
  visibility: VisibilitySchema.optional(),
  search: z.string().trim().max(200).optional(),
  includeDeleted: QueryBooleanSchema.default(false),
});
export type ListAssetsQuery = z.input<typeof ListAssetsQuerySchema>;

export const AssetListSchema = z.object({
  items: z.array(AssetSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  page: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export type AssetList = z.infer<typeof AssetListSchema>;

export const SignedUrlRequestSchema = z.object({
  variant: z.string().trim().min(1).default("original"),
  expiresIn: z.number().int().min(30).max(604800).optional(),
  download: z.boolean().default(false),
});
export type SignedUrlRequest = z.input<typeof SignedUrlRequestSchema>;

export const SignedUrlResponseSchema = z.object({
  url: z.url(),
  expiresAt: z.string().datetime().nullable(),
});
export type SignedUrlResponse = z.infer<typeof SignedUrlResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
