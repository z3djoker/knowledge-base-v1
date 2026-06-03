import { mkdir, readdir, stat, writeFile } from "fs/promises";
import path from "path";
import { formatFileSize } from "./file-format";
import { MAX_UPLOAD_SIZE_BYTES, isAllowedUploadExtension } from "./upload-config";

export type UploadedFile = {
  name: string;
  size: number;
  uploadedAt: string;
};

export { formatFileSize };

const uploadsDirectory = path.join(process.cwd(), "uploads");

export async function ensureUploadsDirectory() {
  await mkdir(uploadsDirectory, { recursive: true });
}

export async function getUploadedFilePath(fileName: string) {
  const safeFileName = path.basename(fileName);

  if (safeFileName !== fileName) {
    throw new Error("Invalid file name.");
  }

  const filePath = path.join(uploadsDirectory, safeFileName);
  const metadata = await stat(filePath);

  if (!metadata.isFile()) {
    throw new Error("Uploaded file not found.");
  }

  return filePath;
}

export async function listUploadedFiles(): Promise<UploadedFile[]> {
  await ensureUploadsDirectory();

  const entries = await readdir(uploadsDirectory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(uploadsDirectory, entry.name);
        const metadata = await stat(filePath);

        return {
          name: entry.name,
          size: metadata.size,
          uploadedAt: metadata.birthtime.toISOString(),
        };
      }),
  );

  return files.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

export async function saveUploadedFile(file: File) {
  if (!file.name) {
    throw new Error("Missing file name.");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File size exceeds the 20MB limit.");
  }

  const originalName = path.basename(file.name);
  const extension = path.extname(originalName).toLowerCase();

  if (!isAllowedUploadExtension(extension)) {
    throw new Error("Unsupported file type.");
  }

  await ensureUploadsDirectory();

  const safeBaseName =
    path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${extension}`;
  const destination = path.join(uploadsDirectory, uniqueName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, bytes);

  return {
    name: uniqueName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}
