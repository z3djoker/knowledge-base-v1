import path from "path";
import { parseDocx } from "./docx";
import { parsePdf } from "./pdf";
import { parsePptx } from "./pptx";
import { parseXlsx } from "./xlsx";
import type { ParsedDocument } from "./shared";

export const supportedParseExtensions = [".pdf", ".docx", ".xlsx", ".pptx"];

export function isSupportedParseExtension(extension: string) {
  return supportedParseExtensions.includes(extension.toLowerCase());
}

export async function parseUploadedDocument(
  filePath: string,
): Promise<ParsedDocument & { fileType: string }> {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return { ...(await parsePdf(filePath)), fileType: "PDF" };
  }

  if (extension === ".docx") {
    return { ...(await parseDocx(filePath)), fileType: "DOCX" };
  }

  if (extension === ".xlsx") {
    return { ...(await parseXlsx(filePath)), fileType: "XLSX" };
  }

  if (extension === ".pptx") {
    return { ...(await parsePptx(filePath)), fileType: "PPTX" };
  }

  throw new Error("File type is not supported for V3.1 parsing.");
}
