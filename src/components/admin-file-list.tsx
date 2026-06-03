"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { formatFileSize } from "@/lib/file-format";
import type { UploadedFile } from "@/lib/files";
import type { ParsedFile } from "@/lib/parsed-files";

type AdminFileListProps = {
  files: UploadedFile[];
  parsedFiles: ParsedFile[];
};

type ParseStatus = {
  tone: "idle" | "loading" | "success" | "error";
  message: string;
};

function formatUploadTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");

  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}

function isParseSupported(fileName: string) {
  return [".pdf", ".docx", ".xlsx", ".pptx"].includes(getExtension(fileName));
}

function createSummary(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "No extractable text found.";
  }

  return normalized.length > 220
    ? `${normalized.slice(0, 220)}...`
    : normalized;
}

export function AdminFileList({ files, parsedFiles }: AdminFileListProps) {
  const { dictionary } = useLanguage();
  const [parsedByFileName, setParsedByFileName] = useState(() =>
    Object.fromEntries(parsedFiles.map((file) => [file.fileName, file])),
  );
  const [parseStatuses, setParseStatuses] = useState<Record<string, ParseStatus>>(
    {},
  );
  const fileLabel =
    files.length === 1
      ? dictionary.admin.fileSingular
      : dictionary.admin.filePlural;
  const parsedCount = useMemo(
    () => files.filter((file) => parsedByFileName[file.name]).length,
    [files, parsedByFileName],
  );

  async function parseFile(fileName: string) {
    setParseStatuses((current) => ({
      ...current,
      [fileName]: { tone: "loading", message: "Parsing..." },
    }));

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to parse file.");
      }

      setParsedByFileName((current) => ({
        ...current,
        [fileName]: result.parsedFile,
      }));
      setParseStatuses((current) => ({
        ...current,
        [fileName]: { tone: "success", message: "Parsed successfully." },
      }));
    } catch (error) {
      setParseStatuses((current) => ({
        ...current,
        [fileName]: {
          tone: "error",
          message: error instanceof Error ? error.message : "Parse failed.",
        },
      }));
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">
          {dictionary.admin.uploadedFiles}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {files.length} {fileLabel} {dictionary.admin.available}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {parsedCount} parsed for V3.1 local text extraction.
        </p>
      </div>

      {files.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          {dictionary.admin.empty}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">
                  {dictionary.admin.fileName}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {dictionary.admin.size}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {dictionary.admin.uploaded}
                </th>
                <th className="px-6 py-3 font-semibold">Parse status</th>
                <th className="px-6 py-3 font-semibold">Text summary</th>
                <th className="px-6 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {files.map((file) => {
                const parsedFile = parsedByFileName[file.name];
                const status = parseStatuses[file.name];
                const isSupported = isParseSupported(file.name);
                const isParsing = status?.tone === "loading";
                const statusMessage =
                  status?.message ??
                  (parsedFile
                    ? `Parsed at ${formatUploadTime(
                        parsedFile.parsedAt,
                        dictionary.admin.dateLocale,
                      )}`
                    : isSupported
                      ? "Not parsed yet."
                      : "Not supported in V3.1.");

                return (
                  <tr key={file.name}>
                    <td className="max-w-[320px] px-6 py-4 font-medium text-slate-900">
                      <span className="block truncate">{file.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatUploadTime(
                        file.uploadedAt,
                        dictionary.admin.dateLocale,
                      )}
                    </td>
                    <td className="max-w-[220px] px-6 py-4 text-slate-600">
                      <span
                        className={
                          status?.tone === "error"
                            ? "text-red-700"
                            : status?.tone === "success" || parsedFile
                              ? "text-emerald-700"
                              : "text-slate-600"
                        }
                      >
                        {statusMessage}
                      </span>
                    </td>
                    <td className="max-w-[360px] px-6 py-4 text-slate-600">
                      {parsedFile ? (
                        <span className="line-clamp-3 block">
                          {createSummary(parsedFile.text)}
                        </span>
                      ) : (
                        <span className="text-slate-400">No summary yet.</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={!isSupported || isParsing}
                        onClick={() => parseFile(file.name)}
                        className="rounded-md bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {isParsing ? "Parsing..." : parsedFile ? "Re-parse" : "Parse"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
