import { readFile } from "fs/promises";
import JSZip from "jszip";
import {
  countWords,
  decodeXmlText,
  extractTextFromXml,
  normalizeText,
  type ParsedDocument,
} from "./shared";

function getSheetNumber(path: string) {
  const match = path.match(/sheet(\d+)\.xml$/);

  return match ? Number(match[1]) : 0;
}

function extractSharedStrings(xml: string) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    extractTextFromXml(match[1]),
  );
}

function extractSheetNames(workbookXml: string) {
  return [...workbookXml.matchAll(/<sheet\b[^>]*name="([^"]+)"/g)].map(
    (match) => decodeXmlText(match[1]),
  );
}

function extractCells(xml: string, sharedStrings: string[]) {
  const cells = [...xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)];

  return cells
    .map((cell) => {
      const attributes = cell[1];
      const body = cell[2];
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];

      if (type === "s" && value) {
        return sharedStrings[Number(value)] ?? "";
      }

      if (type === "inlineStr") {
        return extractTextFromXml(body);
      }

      return value ? decodeXmlText(value) : "";
    })
    .filter(Boolean);
}

export async function parseXlsx(filePath: string): Promise<ParsedDocument> {
  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const sharedStringsXml = await zip
    .file("xl/sharedStrings.xml")
    ?.async("text");
  const workbookXml = await zip.file("xl/workbook.xml")?.async("text");
  const sharedStrings = sharedStringsXml
    ? extractSharedStrings(sharedStringsXml)
    : [];
  const sheetNames = workbookXml ? extractSheetNames(workbookXml) : [];
  const sheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => getSheetNumber(a) - getSheetNumber(b));

  if (sheetFiles.length === 0) {
    throw new Error("XLSX worksheets not found.");
  }

  const sheetTexts = await Promise.all(
    sheetFiles.map(async (sheetFile, index) => {
      const xml = await zip.file(sheetFile)?.async("text");
      const cells = xml ? extractCells(xml, sharedStrings) : [];
      const sheetName = sheetNames[index] ?? `Sheet ${index + 1}`;

      return `Sheet: ${sheetName}\n${cells.join("\n")}`;
    }),
  );
  const text = normalizeText(sheetTexts.join("\n\n"));

  return {
    text,
    metadata: {
      parser: "jszip-xlsx",
      sheetCount: sheetFiles.length,
      characterCount: text.length,
      wordCount: countWords(text),
    },
  };
}
