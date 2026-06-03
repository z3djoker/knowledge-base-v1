import { readFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";
import { countWords, normalizeText, type ParsedDocument } from "./shared";

export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const buffer = await readFile(filePath);
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "esm",
    "pdf.worker.mjs",
  );

  PDFParse.setWorker(pathToFileURL(workerPath).toString());

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = normalizeText(result.text);

    return {
      text,
      metadata: {
        parser: "pdf-parse",
        pageCount: result.pages.length,
        characterCount: text.length,
        wordCount: countWords(text),
      },
    };
  } finally {
    await parser.destroy();
  }
}
