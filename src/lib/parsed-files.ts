import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

export type ParsedFileMetadata = Record<string, string | number | boolean>;

export type ParsedFile = {
  fileName: string;
  fileType: string;
  parsedAt: string;
  text: string;
  metadata: ParsedFileMetadata;
};

const parsedDirectory = path.join(process.cwd(), "parsed");

export async function ensureParsedDirectory() {
  await mkdir(parsedDirectory, { recursive: true });
}

function getParsedFilePath(fileName: string) {
  return path.join(parsedDirectory, `${path.basename(fileName)}.json`);
}

export async function saveParsedFile(parsedFile: ParsedFile) {
  await ensureParsedDirectory();

  await writeFile(
    getParsedFilePath(parsedFile.fileName),
    JSON.stringify(parsedFile, null, 2),
    "utf8",
  );

  return parsedFile;
}

export async function listParsedFiles(): Promise<ParsedFile[]> {
  await ensureParsedDirectory();

  const entries = await readdir(parsedDirectory, { withFileTypes: true });
  const parsedFiles = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const content = await readFile(
          path.join(parsedDirectory, entry.name),
          "utf8",
        );

        return JSON.parse(content) as ParsedFile;
      }),
  );

  return parsedFiles.sort(
    (a, b) => new Date(b.parsedAt).getTime() - new Date(a.parsedAt).getTime(),
  );
}

export async function deleteParsedFile(fileName: string) {
  try {
    await unlink(getParsedFilePath(fileName));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { deleted: false };
    }

    throw error;
  }

  return { deleted: true };
}
