export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

export const allowedUploadExtensions = [
  ".pdf",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".docx",
  ".xlsx",
] as const;

export const uploadAcceptAttribute = allowedUploadExtensions.join(",");

export function isAllowedUploadExtension(extension: string) {
  return allowedUploadExtensions.includes(
    extension.toLowerCase() as (typeof allowedUploadExtensions)[number],
  );
}
