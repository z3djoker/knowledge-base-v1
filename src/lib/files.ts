import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { formatFileSize } from "./file-format";
import {
  calculateFileSha256,
  runDatabaseSync,
  upsertFileRecord,
} from "./knowledge-db";
import { MAX_UPLOAD_SIZE_BYTES, isAllowedUploadExtension } from "./upload-config";

export type UploadedFile = {
  name: string;
  originalName: string;
  size: number;
  uploadedAt: string;
};

export { formatFileSize };

const uploadsDirectory = path.join(process.cwd(), "uploads");

function getOriginalNameFromStoredName(fileName: string) {
  const parts = fileName.split("-");

  if (parts.length >= 7 && /^\d+$/.test(parts[0])) {
    return parts.slice(6).join("-");
  }

  return fileName;
}

function normalizeDuplicateKey(fileName: string) {
  const originalName = path.basename(fileName);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension).toLowerCase();

  return `${baseName}${extension}`;
}

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
          originalName: getOriginalNameFromStoredName(entry.name),
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
    throw new Error("\u6587\u4ef6\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 200MB\u3002");
  }

  const originalName = path.basename(file.name);
  const extension = path.extname(originalName).toLowerCase();

  if (!isAllowedUploadExtension(extension)) {
    throw new Error("Unsupported file type.");
  }

  await ensureUploadsDirectory();

  const existingFiles = await listUploadedFiles();
  const duplicateFile = existingFiles.find(
    (existingFile) =>
      normalizeDuplicateKey(existingFile.originalName) ===
      normalizeDuplicateKey(originalName),
  );

  if (duplicateFile) {
    const fileType = extension.slice(1).toUpperCase();

    throw new Error(
      `\u540c\u540d ${fileType} \u6587\u4ef6\u5df2\u5b58\u5728\u3002`,
    );
  }

  const safeBaseName =
    path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${extension}`;
  const destination = path.join(uploadsDirectory, uniqueName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, bytes);

  const savedFile = {
    name: uniqueName,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  await runDatabaseSync("upsert uploaded file", async () => {
    await upsertFileRecord({
      fileName: savedFile.name,
      originalName: savedFile.originalName,
      storagePath: path.join("uploads", savedFile.name),
      size: savedFile.size,
      uploadedAt: savedFile.uploadedAt,
      mimeType: file.type || undefined,
      sha256: await calculateFileSha256(destination),
    });
  });

  return savedFile;
}

export async function deleteUploadedFile(fileName: string) {
  const filePath = await getUploadedFilePath(fileName);

  await unlink(filePath);

  return { fileName: path.basename(fileName) };
}
