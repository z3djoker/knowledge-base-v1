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

type DeleteStatus = {
  tone: "loading" | "success" | "error";
  message: string;
};

const adminText = {
  delete: "\u5220\u9664",
  deleting: "\u5220\u9664\u4e2d",
  deleteSuccess: "\u5220\u9664\u6210\u529f",
  deleteFailed: "\u5220\u9664\u5931\u8d25",
  confirmDelete:
    "\u786e\u8ba4\u5220\u9664\u8be5\u6587\u4ef6\u5417\uff1f\u5982\u679c\u5df2\u89e3\u6790\uff0c\u5bf9\u5e94\u7684\u89e3\u6790\u7ed3\u679c\u4e5f\u4f1a\u88ab\u5220\u9664\u3002",
  storedFileName: "\u5b58\u50a8\u6587\u4ef6\u540d",
  parseStatus: "\u89e3\u6790\u72b6\u6001",
  textSummary: "\u6587\u672c\u6458\u8981",
  action: "\u64cd\u4f5c",
  parsing: "\u89e3\u6790\u4e2d",
  parseSuccess: "\u89e3\u6790\u6210\u529f",
  parseFailed: "\u89e3\u6790\u5931\u8d25",
  parsedAt: "\u5df2\u89e3\u6790\u4e8e",
  notParsed: "\u5c1a\u672a\u89e3\u6790",
  unsupported: "V3.1 \u6682\u4e0d\u652f\u6301\u89e3\u6790",
  noSummary: "\u6682\u65e0\u6458\u8981",
  parse: "\u89e3\u6790",
  reparse: "\u91cd\u65b0\u89e3\u6790",
  localParsed: "V3.1 \u672c\u5730\u6587\u672c\u89e3\u6790",
  parsedFiles: "\u5df2\u89e3\u6790",
  fileUnit: "\u4e2a\u6587\u4ef6",
  noExtractedText: "\u672a\u63d0\u53d6\u5230\u6587\u672c\u5185\u5bb9\u3002",
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
    return adminText.noExtractedText;
  }

  return normalized.length > 220
    ? `${normalized.slice(0, 220)}...`
    : normalized;
}

export function AdminFileList({ files, parsedFiles }: AdminFileListProps) {
  const { dictionary } = useLanguage();
  const [visibleFiles, setVisibleFiles] = useState(files);
  const [parsedByFileName, setParsedByFileName] = useState(() =>
    Object.fromEntries(parsedFiles.map((file) => [file.fileName, file])),
  );
  const [parseStatuses, setParseStatuses] = useState<Record<string, ParseStatus>>(
    {},
  );
  const [deleteStatuses, setDeleteStatuses] = useState<
    Record<string, DeleteStatus>
  >({});
  const fileLabel =
    visibleFiles.length === 1
      ? dictionary.admin.fileSingular
      : dictionary.admin.filePlural;
  const parsedCount = useMemo(
    () => visibleFiles.filter((file) => parsedByFileName[file.name]).length,
    [visibleFiles, parsedByFileName],
  );

  async function parseFile(fileName: string) {
    setParseStatuses((current) => ({
      ...current,
      [fileName]: { tone: "loading", message: adminText.parsing },
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
        [fileName]: { tone: "success", message: adminText.parseSuccess },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";

      setParseStatuses((current) => ({
        ...current,
        [fileName]: {
          tone: "error",
          message: `${adminText.parseFailed}\uff1a${message}`,
        },
      }));
    }
  }

  async function deleteFile(fileName: string) {
    if (!window.confirm(adminText.confirmDelete)) {
      return;
    }

    setDeleteStatuses((current) => ({
      ...current,
      [fileName]: { tone: "loading", message: adminText.deleting },
    }));

    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? adminText.deleteFailed);
      }

      setVisibleFiles((current) =>
        current.filter((file) => file.name !== fileName),
      );
      setParsedByFileName((current) => {
        const next = { ...current };
        delete next[fileName];
        return next;
      });
      setDeleteStatuses((current) => ({
        ...current,
        [fileName]: {
          tone: "success",
          message: adminText.deleteSuccess,
        },
      }));
    } catch (error) {
      setDeleteStatuses((current) => ({
        ...current,
        [fileName]: {
          tone: "error",
          message: `${adminText.deleteFailed}\uff1a${
            error instanceof Error ? error.message : "\u672a\u77e5\u9519\u8bef"
          }`,
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
          {visibleFiles.length} {fileLabel} {dictionary.admin.available}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {adminText.localParsed}\uff1a{adminText.parsedFiles} {parsedCount}{" "}
          {adminText.fileUnit}\u3002
        </p>
      </div>

      {visibleFiles.length === 0 ? (
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
                <th className="px-6 py-3 font-semibold">
                  {adminText.parseStatus}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {adminText.textSummary}
                </th>
                <th className="px-6 py-3 font-semibold">{adminText.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleFiles.map((file) => {
                const parsedFile = parsedByFileName[file.name];
                const status = parseStatuses[file.name];
                const deleteStatus = deleteStatuses[file.name];
                const isSupported = isParseSupported(file.name);
                const isParsing = status?.tone === "loading";
                const isDeleting = deleteStatus?.tone === "loading";
                const statusMessage =
                  status?.message ??
                  (parsedFile
                    ? `${adminText.parsedAt} ${formatUploadTime(
                        parsedFile.parsedAt,
                        dictionary.admin.dateLocale,
                      )}`
                    : isSupported
                      ? adminText.notParsed
                      : adminText.unsupported);

                return (
                  <tr key={file.name}>
                    <td className="max-w-[320px] px-6 py-4 font-medium text-slate-900">
                      <span className="block truncate">{file.originalName}</span>
                      {file.originalName !== file.name ? (
                        <span className="mt-1 block truncate text-xs font-normal text-slate-400">
                          {adminText.storedFileName}\uff1a{file.name}
                        </span>
                      ) : null}
                      {deleteStatus ? (
                        <span
                          className={`mt-1 block text-xs font-normal ${
                            deleteStatus.tone === "error"
                              ? "text-red-700"
                              : deleteStatus.tone === "success"
                                ? "text-emerald-700"
                                : "text-slate-500"
                          }`}
                        >
                          {deleteStatus.message}
                        </span>
                      ) : null}
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
                        <span className="text-slate-400">
                          {adminText.noSummary}
                        </span>
                      )}
                    </td>
                    <td className="space-x-2 px-6 py-4">
                      <button
                        type="button"
                        disabled={!isSupported || isParsing || isDeleting}
                        onClick={() => parseFile(file.name)}
                        className="rounded-md bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {isParsing
                          ? adminText.parsing
                          : parsedFile
                            ? adminText.reparse
                            : adminText.parse}
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => deleteFile(file.name)}
                        className="rounded-md border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {isDeleting ? adminText.deleting : adminText.delete}
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
