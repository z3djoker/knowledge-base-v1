import { readFile } from "fs/promises";
import JSZip from "jszip";
import {
  countWords,
  extractTextFromXml,
  normalizeText,
  type ParsedDocument,
} from "./shared";

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("text");

  if (!documentXml) {
    throw new Error("DOCX document content not found.");
  }

  const text = normalizeText(extractTextFromXml(documentXml));

  return {
    text,
    metadata: {
      parser: "jszip-docx",
      characterCount: text.length,
      wordCount: countWords(text),
    },
  };
}
