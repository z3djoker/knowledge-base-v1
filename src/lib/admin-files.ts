import type { Prisma } from "@prisma/client";
import type { FileMetadata, MetadataOptionField } from "./file-metadata-schema";
import { metadataVersion } from "./file-metadata-schema";
import { getPrisma } from "./db";
import { listFileMetadata } from "./file-metadata";
import { listUploadedFiles, type UploadedFile } from "./files";
import { listParsedFiles, type ParsedFile } from "./parsed-files";

type AdminFileSource = "database" | "filesystem";

type ListAdminFilesOptions = {
  page?: number;
  pageSize?: number;
};

export type AdminFilesResult = {
  files: UploadedFile[];
  metadata: FileMetadata[];
  parsedFiles: ParsedFile[];
  source: AdminFileSource;
  databaseAvailable: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

const defaultPage = 1;
const defaultPageSize = 50;

function normalizePage(value?: number) {
  return value && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : defaultPage;
}

function normalizePageSize(value?: number) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return defaultPageSize;
  }

  return Math.min(Math.floor(value), 200);
}

function createOption(value?: string | null): MetadataOptionField {
  return { value: value || "其他" };
}

function metadataFromDatabaseFile(file: DatabaseFile): FileMetadata {
  const legacyMetadata = getLegacyMetadata(file.extraMetadata);

  return {
    metadataVersion,
    fileName: file.storedName,
    originalName: file.originalName,
    category: createOption(file.category),
    businessDirection: createOption(file.businessDirection),
    projectStage: createOption(file.projectStage),
    visibility: file.visibility,
    industry: createOption(file.industry),
    importance: file.importance,
    version: file.version,
    status: legacyMetadata?.status ?? file.status,
    customerName: file.customerName ?? "",
    projectName: file.projectName ?? "",
    tags: file.fileTags.length
      ? file.fileTags.map((fileTag) => fileTag.tag.name)
      : legacyMetadata?.tags ?? [],
    note: legacyMetadata?.note ?? "",
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

function parsedFileFromDatabaseFile(file: DatabaseFile): ParsedFile | undefined {
  const latestParsedDocument = file.parsedDocuments[0];

  if (!latestParsedDocument && file.parseStatus !== "success") {
    return undefined;
  }

  return {
    fileName: file.storedName,
    fileType: file.extension?.replace(/^\./, "").toUpperCase() ?? "UNKNOWN",
    parsedAt:
      latestParsedDocument?.parsedAt.toISOString() ??
      file.updatedAt.toISOString(),
    text: latestParsedDocument?.summary ?? "",
    metadata: {
      parseStatus: file.parseStatus,
      ...(file.parseError ? { parseError: file.parseError } : {}),
      ...(latestParsedDocument?.parserName
        ? { parserName: latestParsedDocument.parserName }
        : {}),
      ...(latestParsedDocument?.wordCount
        ? { wordCount: latestParsedDocument.wordCount }
        : {}),
      ...(latestParsedDocument?.charCount
        ? { charCount: latestParsedDocument.charCount }
        : {}),
    },
  };
}

function uploadedFileFromDatabaseFile(file: DatabaseFile): UploadedFile {
  return {
    name: file.storedName,
    originalName: file.originalName,
    size: Number(file.sizeBytes ?? 0),
    uploadedAt: file.uploadedAt.toISOString(),
  };
}

async function listAdminFilesFromFilesystem(
  options: Required<ListAdminFilesOptions>,
): Promise<AdminFilesResult> {
  const [files, metadata, parsedFiles] = await Promise.all([
    listUploadedFiles(),
    listFileMetadata(),
    listParsedFiles(),
  ]);
  const paginatedFiles = paginate(files, options);

  return {
    files: paginatedFiles,
    metadata,
    parsedFiles,
    source: "filesystem",
    databaseAvailable: false,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total: files.length,
    },
  };
}

export async function listAdminFiles(
  options: ListAdminFilesOptions = {},
): Promise<AdminFilesResult> {
  const normalizedOptions = {
    page: normalizePage(options.page),
    pageSize: normalizePageSize(options.pageSize),
  };

  try {
    return await listAdminFilesFromDatabase(normalizedOptions);
  } catch (error) {
    console.error("[v4-admin-files] database read failed", error);

    return listAdminFilesFromFilesystem(normalizedOptions);
  }
}

async function listAdminFilesFromDatabase(
  options: Required<ListAdminFilesOptions>,
): Promise<AdminFilesResult> {
  const prisma = getPrisma();
  const [
    databaseFiles,
    total,
    databaseFileNames,
    filesystemFiles,
    filesystemMetadata,
    filesystemParsed,
  ] =
    await Promise.all([
      prisma.file.findMany({
        where: { deletedAt: null },
        orderBy: { uploadedAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
        include: {
          parsedDocuments: {
            where: { isLatest: true },
            orderBy: { parsedAt: "desc" },
            take: 1,
            select: {
              id: true,
              parserName: true,
              summary: true,
              wordCount: true,
              charCount: true,
              status: true,
              errorMessage: true,
              parsedAt: true,
            },
          },
          fileTags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.file.count({ where: { deletedAt: null } }),
      prisma.file.findMany({
        where: { deletedAt: null },
        select: { storedName: true },
      }),
      listUploadedFiles(),
      listFileMetadata(),
      listParsedFiles(),
    ]);
  const filesystemByName = new Map(
    filesystemFiles.map((file) => [file.name, file]),
  );
  const allDatabaseFileNames = new Set(
    databaseFileNames.map((file) => file.storedName),
  );
  const fallbackFiles = filesystemFiles.filter(
    (file) => !allDatabaseFileNames.has(file.name),
  );
  const files = [
    ...databaseFiles.map((file) => {
      const fallback = filesystemByName.get(file.storedName);

      return {
        ...uploadedFileFromDatabaseFile(file),
        size: fallback?.size ?? Number(file.sizeBytes ?? 0),
      };
    }),
    ...fallbackFiles,
  ].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
  const metadataByName = new Map(
    filesystemMetadata.map((metadata) => [metadata.fileName, metadata]),
  );
  const parsedByName = new Map(
    filesystemParsed.map((parsedFile) => [parsedFile.fileName, parsedFile]),
  );
  const metadata = [
    ...databaseFiles.map((file) => metadataFromDatabaseFile(file)),
    ...fallbackFiles
      .map((file) => metadataByName.get(file.name))
      .filter((metadata): metadata is FileMetadata => Boolean(metadata)),
  ];
  const parsedFiles = [
    ...databaseFiles
      .map((file) => parsedFileFromDatabaseFile(file))
      .filter((parsedFile): parsedFile is ParsedFile => Boolean(parsedFile)),
    ...fallbackFiles
      .map((file) => parsedByName.get(file.name))
      .filter((parsedFile): parsedFile is ParsedFile => Boolean(parsedFile)),
  ];

  return {
    files,
    metadata,
    parsedFiles,
    source: "database",
    databaseAvailable: true,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total: total + fallbackFiles.length,
    },
  };
}

function paginate<T>(items: T[], options: Required<ListAdminFilesOptions>) {
  const start = (options.page - 1) * options.pageSize;

  return items.slice(start, start + options.pageSize);
}

function getLegacyMetadata(value: unknown): FileMetadata | undefined {
  if (!value || typeof value !== "object" || !("legacyMetadata" in value)) {
    return undefined;
  }

  const legacyMetadata = (value as { legacyMetadata?: unknown }).legacyMetadata;

  if (!legacyMetadata || typeof legacyMetadata !== "object") {
    return undefined;
  }

  return legacyMetadata as FileMetadata;
}

type DatabaseFile = Prisma.FileGetPayload<{
  include: {
    parsedDocuments: {
      select: {
        id: true;
        parserName: true;
        summary: true;
        wordCount: true;
        charCount: true;
        status: true;
        errorMessage: true;
        parsedAt: true;
      };
    };
    fileTags: {
      include: {
        tag: true;
      };
    };
  };
}>;
