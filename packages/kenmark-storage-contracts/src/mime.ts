/** Hard platform upload cap. Project allowlists may only narrow this. */
export const PLATFORM_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/rtf",
  "text/plain",
  "text/csv",
  "audio/mpeg",
  "audio/wav",
] as const;

export type PlatformMimeType = (typeof PLATFORM_ALLOWED_MIME_TYPES)[number];

/** @deprecated Use PLATFORM_ALLOWED_MIME_TYPES. Kept as the create-project default. */
export const DEFAULT_ALLOWED_MIME_TYPES = PLATFORM_ALLOWED_MIME_TYPES;

const PLATFORM_SET = new Set<string>(PLATFORM_ALLOWED_MIME_TYPES);

const OOXML_MIME_BY_EXTENSION: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const MIME_EXTENSIONS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tif", ".tiff"],
  "video/mp4": [".mp4", ".m4v"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.oasis.opendocument.text": [".odt"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  "application/vnd.oasis.opendocument.presentation": [".odp"],
  "application/rtf": [".rtf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
} as const satisfies Record<PlatformMimeType, readonly string[]>;

const EXTENSION_TO_MIME = new Map<string, string>();
for (const [mime, extensions] of Object.entries(MIME_EXTENSIONS)) {
  for (const extension of extensions) EXTENSION_TO_MIME.set(extension, mime);
}

export function normalizeMimeType(value: string): string {
  return value.split(";", 1)[0]?.trim().toLowerCase() || "application/octet-stream";
}

export function fileExtension(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "");
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function mimeMatchesRules(rules: readonly string[], contentType: string): boolean {
  const normalized = normalizeMimeType(contentType);
  return rules.some((entry) => {
    const rule = normalizeMimeType(entry);
    if (rule === normalized) return true;
    if (rule.endsWith("/*")) return normalized.startsWith(rule.slice(0, -1));
    return false;
  });
}

export function isPlatformMimeAllowed(contentType: string): boolean {
  return PLATFORM_SET.has(normalizeMimeType(contentType));
}

export function isMimeAllowed(projectAllowed: readonly string[], contentType: string): boolean {
  if (!isPlatformMimeAllowed(contentType)) return false;
  const rules = projectAllowed.length > 0 ? projectAllowed : PLATFORM_ALLOWED_MIME_TYPES;
  return mimeMatchesRules(rules, contentType);
}

export function inferMimeFromFilename(filename: string): string | null {
  return EXTENSION_TO_MIME.get(fileExtension(filename)) ?? null;
}

export function resolveUploadContentType(fileType: string, filename: string): string {
  const declared = normalizeMimeType(fileType);
  if (declared !== "application/octet-stream") return declared;
  return inferMimeFromFilename(filename) ?? declared;
}

export function resolveStoredContentType(input: {
  declared: string;
  detected: string | null;
  filename: string;
}): string {
  const declared = normalizeMimeType(input.declared);
  const detected = input.detected ? normalizeMimeType(input.detected) : null;
  const ooxml = OOXML_MIME_BY_EXTENSION[fileExtension(input.filename)];
  if (detected === "application/zip" && ooxml && ooxml === declared) return declared;
  return detected ?? declared;
}

export function uploadAcceptAttribute(): string {
  const extensions = [...new Set(Object.values(MIME_EXTENSIONS).flat())];
  return [...PLATFORM_ALLOWED_MIME_TYPES, ...extensions].join(",");
}
