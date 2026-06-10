import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getPrisma } from "./db";
import type { FileMetadata } from "./file-metadata-schema";
import { getEffectiveMetadataValue } from "./file-metadata-schema";
import type { ParsedFile } from "./parsed-files";

export const defaultCustomer = {
  code: "system",
  name: "System",
};

export const defaultProject = {
  code: "system-project",
  name: "System Project",
};

type FileRecordInput = {
  fileName: string;
  originalName: string;
  storagePath?: string;
  size?: number;
  uploadedAt?: string;
  mimeType?: string;
  sha256?: string;
};

function toDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function extensionFromFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  return extension || undefined;
}

function normalizeTagSlug(tag: string) {
  return (
    tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tag"
  );
}

export async function calculateFileSha256(filePath: string) {
  const buffer = await readFile(filePath);

  return createHash("sha256").update(buffer).digest("hex");
}

export async function ensureSystemProject() {
  const prisma = getPrisma();
  const customer = await prisma.customer.upsert({
    where: { code: defaultCustomer.code },
    update: { name: defaultCustomer.name, status: "active" },
    create: {
      code: defaultCustomer.code,
      name: defaultCustomer.name,
      status: "active",
    },
  });

  return prisma.project.upsert({
    where: {
      customerId_code: {
        customerId: customer.id,
        code: defaultProject.code,
      },
    },
    update: {
      name: defaultProject.name,
      status: "active",
    },
    create: {
      customerId: customer.id,
      code: defaultProject.code,
      name: defaultProject.name,
      status: "active",
    },
  });
}

export async function upsertFileRecord(input: FileRecordInput) {
  const prisma = getPrisma();
  const project = await ensureSystemProject();
  const storagePath = input.storagePath ?? path.join("uploads", input.fileName);
  const uploadedAt = toDate(input.uploadedAt);

  const existing = await prisma.file.findFirst({
    where: { storedName: input.fileName },
  });

  const data = {
    projectId: project.id,
    originalName: input.originalName,
    storedName: input.fileName,
    storagePath,
    mimeType: input.mimeType,
    extension: extensionFromFileName(input.originalName),
    sizeBytes:
      typeof input.size === "number" ? BigInt(input.size) : undefined,
    sha256: input.sha256,
    customerName: defaultCustomer.name,
    projectName: defaultProject.name,
    status: "uploaded",
    parseStatus: "pending",
    source: "upload",
    uploadedAt,
  };

  if (existing) {
    return prisma.file.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.file.create({
    data: {
      ...data,
      uploadedAt: uploadedAt ?? new Date(),
    },
  });
}

export async function upsertFileRecordFromPath(filePath: string) {
  const fileName = path.basename(filePath);
  const fileStat = await stat(filePath);
  const sha256 = await calculateFileSha256(filePath);

  return upsertFileRecord({
    fileName,
    originalName: getOriginalNameFromStoredName(fileName),
    storagePath: path.join("uploads", fileName),
    size: fileStat.size,
    uploadedAt: fileStat.birthtime.toISOString(),
    sha256,
  });
}

export async function upsertParsedDocument(parsedFile: ParsedFile) {
  const prisma = getPrisma();
  const file = await upsertFileRecord({
    fileName: parsedFile.fileName,
    originalName: getOriginalNameFromStoredName(parsedFile.fileName),
  });

  await prisma.parsedDocument.updateMany({
    where: { fileId: file.id, isLatest: true },
    data: { isLatest: false },
  });

  const parsedDocument = await prisma.parsedDocument.create({
    data: {
      fileId: file.id,
      parserName: "local-parser",
      contentText: parsedFile.text,
      contentJson: parsedFile.metadata,
      charCount: parsedFile.text.length,
      status: "success",
      isLatest: true,
      parsedAt: toDate(parsedFile.parsedAt) ?? new Date(),
    },
  });

  await prisma.file.update({
    where: { id: file.id },
    data: {
      status: "parsed",
      parseStatus: "success",
      parseError: null,
    },
  });

  return parsedDocument;
}

export function mapMetadataToFileFields(metadata: FileMetadata) {
  return {
    category: getEffectiveMetadataValue(metadata.category),
    industry: getEffectiveMetadataValue(metadata.industry),
    businessDirection: getEffectiveMetadataValue(metadata.businessDirection),
    projectStage: getEffectiveMetadataValue(metadata.projectStage),
    visibility: metadata.visibility,
    importance: metadata.importance,
    version: metadata.version,
    customerName: metadata.customerName || defaultCustomer.name,
    projectName: metadata.projectName || defaultProject.name,
    extraMetadata: {
      legacyMetadata: metadata,
      businessStatus: metadata.status,
      note: metadata.note,
      migrationSource: "metadata_directory",
      migrationVersion: "v4.2",
    },
  };
}

export async function upsertMetadataRecord(metadata: FileMetadata) {
  const prisma = getPrisma();
  const file = await upsertFileRecord({
    fileName: metadata.fileName,
    originalName: metadata.originalName,
  });
  const mapped = mapMetadataToFileFields(metadata);

  await prisma.file.update({
    where: { id: file.id },
    data: mapped,
  });

  await syncFileTags(file.id, metadata.tags);

  return prisma.file.findUnique({ where: { id: file.id } });
}

async function syncFileTags(fileId: string, tags: string[]) {
  const prisma = getPrisma();
  await prisma.fileTag.deleteMany({ where: { fileId } });

  for (const tagName of tags.map((tag) => tag.trim()).filter(Boolean)) {
    const tag = await prisma.tag.upsert({
      where: { slug: normalizeTagSlug(tagName) },
      update: { name: tagName },
      create: {
        name: tagName,
        slug: normalizeTagSlug(tagName),
      },
    });

    await prisma.fileTag.upsert({
      where: {
        fileId_tagId: {
          fileId,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        fileId,
        tagId: tag.id,
      },
    });
  }
}

export async function runDatabaseSync<T>(
  operation: string,
  callback: () => Promise<T>,
) {
  try {
    return await callback();
  } catch (error) {
    console.error(`[v4-db-sync] ${operation} failed`, error);

    return undefined;
  }
}

function getOriginalNameFromStoredName(fileName: string) {
  const parts = fileName.split("-");

  if (parts.length >= 7 && /^\d+$/.test(parts[0])) {
    return parts.slice(6).join("-");
  }

  return fileName;
}
