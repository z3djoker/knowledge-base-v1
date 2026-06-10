import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "crypto";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional when DATABASE_URL is already set by the shell.
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required. Copy .env.example to .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const defaultCustomer = {
  code: "system",
  name: "System",
};

const defaultProject = {
  code: "system-project",
  name: "System Project",
};

const uploadsDirectory = path.join(process.cwd(), "uploads");
const parsedDirectory = path.join(process.cwd(), "parsed");
const metadataDirectory = path.join(process.cwd(), "metadata");

const report = {
  filesScanned: 0,
  filesCreated: 0,
  filesUpdated: 0,
  metadataScanned: 0,
  metadataUpdated: 0,
  parsedScanned: 0,
  parsedCreated: 0,
  tagsSynced: 0,
  errors: [],
};

function originalNameFromStoredName(fileName) {
  const parts = fileName.split("-");

  if (parts.length >= 7 && /^\d+$/.test(parts[0])) {
    return parts.slice(6).join("-");
  }

  return fileName;
}

function optionValue(field) {
  if (!field) {
    return undefined;
  }

  if (field.value === "其他" && field.customValue) {
    return field.customValue;
  }

  return field.value;
}

function normalizeTagSlug(tag) {
  return (
    tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tag"
  );
}

async function safeListFiles(directory, predicate = () => true) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && predicate(entry.name))
      .map((entry) => path.join(directory, entry.name));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function sha256(filePath) {
  const buffer = await readFile(filePath);

  return createHash("sha256").update(buffer).digest("hex");
}

async function ensureSystemProject() {
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
    update: { name: defaultProject.name, status: "active" },
    create: {
      customerId: customer.id,
      code: defaultProject.code,
      name: defaultProject.name,
      status: "active",
    },
  });
}

async function upsertFile(project, input) {
  const existing = await prisma.file.findFirst({
    where: { storedName: input.fileName },
  });
  const data = {
    projectId: project.id,
    originalName: input.originalName,
    storedName: input.fileName,
    storagePath: input.storagePath,
    extension: path.extname(input.originalName).toLowerCase() || undefined,
    sizeBytes:
      typeof input.size === "number" ? BigInt(input.size) : undefined,
    sha256: input.sha256,
    customerName: defaultCustomer.name,
    projectName: defaultProject.name,
    source: "upload",
    status: input.status ?? "uploaded",
    parseStatus: input.parseStatus ?? "pending",
    uploadedAt: input.uploadedAt,
  };

  if (existing) {
    report.filesUpdated += 1;

    return prisma.file.update({
      where: { id: existing.id },
      data,
    });
  }

  report.filesCreated += 1;

  return prisma.file.create({ data });
}

async function migrateUploads(project) {
  const uploadPaths = await safeListFiles(uploadsDirectory);

  for (const filePath of uploadPaths) {
    try {
      report.filesScanned += 1;
      const fileName = path.basename(filePath);
      const fileStat = await stat(filePath);

      await upsertFile(project, {
        fileName,
        originalName: originalNameFromStoredName(fileName),
        storagePath: path.join("uploads", fileName),
        size: fileStat.size,
        uploadedAt: fileStat.birthtime,
        sha256: await sha256(filePath),
      });
    } catch (error) {
      report.errors.push({
        stage: "uploads",
        file: path.basename(filePath),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function migrateMetadata(project) {
  const metadataPaths = await safeListFiles(metadataDirectory, (name) =>
    name.endsWith(".json"),
  );

  for (const metadataPath of metadataPaths) {
    try {
      report.metadataScanned += 1;
      const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      const file = await upsertFile(project, {
        fileName: metadata.fileName,
        originalName: metadata.originalName,
        storagePath: path.join("uploads", metadata.fileName),
      });

      await prisma.file.update({
        where: { id: file.id },
        data: {
          category: optionValue(metadata.category),
          industry: optionValue(metadata.industry),
          businessDirection: optionValue(metadata.businessDirection),
          projectStage: optionValue(metadata.projectStage),
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
        },
      });

      await syncTags(file.id, metadata.tags ?? []);
      report.metadataUpdated += 1;
    } catch (error) {
      report.errors.push({
        stage: "metadata",
        file: path.basename(metadataPath),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function migrateParsed(project) {
  const parsedPaths = await safeListFiles(parsedDirectory, (name) =>
    name.endsWith(".json"),
  );

  for (const parsedPath of parsedPaths) {
    try {
      report.parsedScanned += 1;
      const parsed = JSON.parse(await readFile(parsedPath, "utf8"));
      const file = await upsertFile(project, {
        fileName: parsed.fileName,
        originalName: originalNameFromStoredName(parsed.fileName),
        storagePath: path.join("uploads", parsed.fileName),
        status: "parsed",
        parseStatus: "success",
      });

      const existing = await prisma.parsedDocument.findFirst({
        where: {
          fileId: file.id,
          parsedAt: new Date(parsed.parsedAt),
        },
      });

      if (!existing) {
        await prisma.parsedDocument.updateMany({
          where: { fileId: file.id, isLatest: true },
          data: { isLatest: false },
        });

        await prisma.parsedDocument.create({
          data: {
            fileId: file.id,
            parserName: "local-parser",
            contentText: parsed.text,
            contentJson: parsed.metadata,
            charCount: parsed.text?.length ?? 0,
            status: "success",
            isLatest: true,
            parsedAt: new Date(parsed.parsedAt),
          },
        });
        report.parsedCreated += 1;
      }

      await prisma.file.update({
        where: { id: file.id },
        data: {
          status: "parsed",
          parseStatus: "success",
          parseError: null,
        },
      });
    } catch (error) {
      report.errors.push({
        stage: "parsed",
        file: path.basename(parsedPath),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function syncTags(fileId, tags) {
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
    report.tagsSynced += 1;
  }
}

async function main() {
  const project = await ensureSystemProject();

  await migrateUploads(project);
  await migrateMetadata(project);
  await migrateParsed(project);

  console.log(JSON.stringify(report, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
