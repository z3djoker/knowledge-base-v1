export type ParsedDocument = {
  text: string;
  metadata: Record<string, string | number | boolean>;
};

export function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(value: string) {
  const matches = value.trim().match(/\S+/g);

  return matches?.length ?? 0;
}

export function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractTextFromXml(xml: string) {
  const textNodes = [...xml.matchAll(/<[^:>]*:?t\b[^>]*>([\s\S]*?)<\/[^:>]*:?t>/g)];

  return normalizeText(
    textNodes.map((match) => decodeXmlText(match[1])).join(" "),
  );
}
