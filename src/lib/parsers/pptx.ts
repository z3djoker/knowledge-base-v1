import { readFile } from "fs/promises";
import JSZip from "jszip";
import {
  countWords,
  extractTextFromXml,
  normalizeText,
  type ParsedDocument,
} from "./shared";

function getSlideNumber(path: string) {
  const match = path.match(/slide(\d+)\.xml$/);

  return match ? Number(match[1]) : 0;
}

export async function parsePptx(filePath: string): Promise<ParsedDocument> {
  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => getSlideNumber(a) - getSlideNumber(b));

  if (slideFiles.length === 0) {
    throw new Error("PPTX slides not found.");
  }

  const slideTexts = await Promise.all(
    slideFiles.map(async (slideFile, index) => {
      const xml = await zip.file(slideFile)?.async("text");
      const text = xml ? extractTextFromXml(xml) : "";

      return `Slide ${index + 1}\n${text}`;
    }),
  );
  const text = normalizeText(slideTexts.join("\n\n"));

  return {
    text,
    metadata: {
      parser: "jszip-pptx",
      slideCount: slideFiles.length,
      characterCount: text.length,
      wordCount: countWords(text),
    },
  };
}
