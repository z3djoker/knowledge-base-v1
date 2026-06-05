import { mkdir, rename, stat } from "fs/promises";
import path from "path";
import { getPrisma } from "./db";
import { upsertFileRecord, upsertFileRecordFromPath } from "./knowledge-db";

type LocalMoveStatus = "moved" | "missing" | "failed";

type LocalMoveResult = {
  status: LocalMoveStatus;
  sourcePath: string;
  trashPath?: string;
  error?: string;
};

export type DeleteKnowledgeAssetResult = {
  deletedFileName: string;
  databaseDeleted: boolean;
  deletedParsedResult: boolean;
  deletedMetadata: boolean;
  warning?: string;
  localFiles: {
    upload: LocalMoveResult;
    parsed: LocalMoveResult;
    metadata: LocalMoveResult;
  };
};

const uploadsDirectory = path.join(process.cwd(), "uploads");
const parsedDirectory = path.join(process.cwd(), "parsed");
const metadataDirectory = path.join(process.cwd(), "metadata");
const trashDirectory = path.join(process.cwd(), "trash");

function safeFileName(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("Invalid file name.");
  }

  return safeName;
}

function trashFileName(fileName: string) {
  return `${Date.now()}-${crypto.randomUUID()}-${fileName}`;
}

async function fileExists(filePath: string) {
  try {
    const metadata = await stat(filePath);

    return metadata.isFile();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function moveToTrash(
  sourcePath: string,
  trashSubdirectory: "uploads" | "parsed" | "metadata",
) {
  if (!(await fileExists(sourcePath))) {
    return {
      status: "missing",
      sourcePath,
    } satisfies LocalMoveResult;
  }

  const destinationDirectory = path.join(trashDirectory, trashSubdirectory);
  const destinationPath = path.join(
    destinationDirectory,
    trashFileName(path.basename(sourcePath)),
  );

  try {
    await mkdir(destinationDirectory, { recursive: true });
    await rename(sourcePath, destinationPath);

    return {
      status: "moved",
      sourcePath,
      trashPath: destinationPath,
    } satisfies LocalMoveResult;
  } catch (error) {
    return {
      status: "failed",
      sourcePath,
      error: error instanceof Error ? error.message : String(error),
    } satisfies LocalMoveResult;
  }
}

async function ensureDeletedFileRecord(fileName: string) {
  const prisma = getPrisma();
  const existing = await prisma.file.findFirst({
    where: { storedName: fileName },
  });

  if (existing) {
    return existing;
  }

  const uploadPath = path.join(uploadsDirectory, fileName);

  if (await fileExists(uploadPath)) {
    return upsertFileRecordFromPath(uploadPath);
  }

  return upsertFileRecord({
    fileName,
    originalName: fileName,
    storagePath: path.join("uploads", fileName),
  });
}

export async function deleteKnowledgeAsset(fileName: string) {
  const safeName = safeFileName(fileName);
  const prisma = getPrisma();
  const file = await ensureDeletedFileRecord(safeName);

  await prisma.file.update({
    where: { id: file.id },
    data: {
      deletedAt: new Date(),
      status: "deleted",
    },
  });

  const localFiles = {
    upload: await moveToTrash(
      path.join(uploadsDirectory, safeName),
      "uploads",
    ),
    parsed: await moveToTrash(
      path.join(parsedDirectory, `${safeName}.json`),
      "parsed",
    ),
    metadata: await moveToTrash(
      path.join(metadataDirectory, `${safeName}.json`),
      "metadata",
    ),
  };
  const hasMoveFailure = Object.values(localFiles).some(
    (result) => result.status === "failed",
  );

  return {
    deletedFileName: safeName,
    databaseDeleted: true,
    deletedParsedResult: localFiles.parsed.status === "moved",
    deletedMetadata: localFiles.metadata.status === "moved",
    ...(hasMoveFailure
      ? {
          warning:
            "文件已从数据库软删除，但部分本地文件移动到回收站失败。",
        }
      : {}),
    localFiles,
  } satisfies DeleteKnowledgeAssetResult;
}
