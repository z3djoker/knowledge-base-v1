import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import type { UploadedFile } from "./files";
import {
  metadataVersion,
  type FileMetadata,
  type FileMetadataInput,
  type MetadataOptionField,
} from "./file-metadata-schema";

const metadataDirectory = path.join(process.cwd(), "metadata");

function createOption(value: string, customValue?: string): MetadataOptionField {
  return customValue ? { value, customValue } : { value };
}

function safeMetadataFilePath(fileName: string) {
  const safeFileName = path.basename(fileName);

  if (safeFileName !== fileName) {
    throw new Error("Invalid file name.");
  }

  return path.join(metadataDirectory, `${safeFileName}.json`);
}

export async function ensureMetadataDirectory() {
  await mkdir(metadataDirectory, { recursive: true });
}

export function createDefaultMetadata(file: UploadedFile): FileMetadata {
  const now = new Date().toISOString();

  return {
    metadataVersion,
    fileName: file.name,
    originalName: file.originalName,
    category: createOption("\u5176\u4ed6"),
    businessDirection: createOption("\u5176\u4ed6"),
    projectStage: createOption("\u552e\u524d"),
    visibility: "\u5185\u90e8\u53ef\u89c1",
    industry: createOption("\u5176\u4ed6"),
    importance: "\u4e2d",
    version: "v1.0",
    status: "\u53ef\u7528",
    customerName: "",
    projectName: "",
    tags: [],
    note: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listFileMetadata(): Promise<FileMetadata[]> {
  await ensureMetadataDirectory();

  const entries = await readdir(metadataDirectory, { withFileTypes: true });
  const metadata = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const content = await readFile(
          path.join(metadataDirectory, entry.name),
          "utf8",
        );

        return JSON.parse(content) as FileMetadata;
      }),
  );

  return metadata.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function saveFileMetadata(input: FileMetadataInput) {
  await ensureMetadataDirectory();

  let existing: FileMetadata | undefined;

  try {
    const content = await readFile(safeMetadataFilePath(input.fileName), "utf8");
    existing = JSON.parse(content) as FileMetadata;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const now = new Date().toISOString();
  const metadata: FileMetadata = {
    metadataVersion,
    fileName: input.fileName,
    originalName: input.originalName,
    category: input.category ?? existing?.category ?? createOption("\u5176\u4ed6"),
    businessDirection:
      input.businessDirection ??
      existing?.businessDirection ??
      createOption("\u5176\u4ed6"),
    projectStage:
      input.projectStage ?? existing?.projectStage ?? createOption("\u552e\u524d"),
    visibility: input.visibility ?? existing?.visibility ?? "\u5185\u90e8\u53ef\u89c1",
    industry: input.industry ?? existing?.industry ?? createOption("\u5176\u4ed6"),
    importance: input.importance ?? existing?.importance ?? "\u4e2d",
    version: input.version ?? existing?.version ?? "v1.0",
    status: input.status ?? existing?.status ?? "\u53ef\u7528",
    customerName: input.customerName ?? existing?.customerName ?? "",
    projectName: input.projectName ?? existing?.projectName ?? "",
    tags: input.tags ?? existing?.tags ?? [],
    note: input.note ?? existing?.note ?? "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await writeFile(
    safeMetadataFilePath(metadata.fileName),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );

  return metadata;
}

export async function deleteFileMetadata(fileName: string) {
  try {
    await unlink(safeMetadataFilePath(fileName));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { deleted: false };
    }

    throw error;
  }

  return { deleted: true };
}
