"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  getEffectiveMetadataValue,
  metadataOptions,
  metadataVersion,
  type FileMetadata,
  type MetadataOptionField,
} from "@/lib/file-metadata-schema";
import { formatFileSize } from "@/lib/file-format";
import type { UploadedFile } from "@/lib/files";
import type { ParsedFile } from "@/lib/parsed-files";

type AdminFileListProps = {
  files: UploadedFile[];
  metadata: FileMetadata[];
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

type SaveStatus = {
  tone: "loading" | "success" | "error";
  message: string;
};

type MetadataFilters = {
  category: string;
  businessDirection: string;
  projectStage: string;
  visibility: string;
};

const adminText = {
  all: "\u5168\u90e8",
  action: "\u64cd\u4f5c",
  businessDirection: "\u4e1a\u52a1\u65b9\u5411",
  cancel: "\u53d6\u6d88",
  category: "\u8d44\u6599\u7c7b\u578b",
  confirmDelete:
    "\u786e\u8ba4\u5220\u9664\u8be5\u6587\u4ef6\u5417\uff1f\u5982\u679c\u5df2\u89e3\u6790\uff0c\u5bf9\u5e94\u7684\u89e3\u6790\u7ed3\u679c\u548c\u5143\u6570\u636e\u4e5f\u4f1a\u88ab\u5220\u9664\u3002",
  customerName: "\u5ba2\u6237\u540d\u79f0",
  delete: "\u5220\u9664",
  deleteFailed: "\u5220\u9664\u5931\u8d25",
  deleteSuccess: "\u5220\u9664\u6210\u529f",
  deleting: "\u5220\u9664\u4e2d",
  editMetadata: "\u7f16\u8f91\u5143\u6570\u636e",
  failedUnknown: "\u672a\u77e5\u9519\u8bef",
  fileUnit: "\u4e2a\u6587\u4ef6",
  filters: "\u7b5b\u9009",
  industry: "\u884c\u4e1a",
  importance: "\u91cd\u8981\u7a0b\u5ea6",
  localParsed: "V3.1 \u672c\u5730\u6587\u672c\u89e3\u6790",
  metadata: "\u5143\u6570\u636e",
  metadataSaved: "\u5143\u6570\u636e\u5df2\u4fdd\u5b58",
  noExtractedText: "\u672a\u63d0\u53d6\u5230\u6587\u672c\u5185\u5bb9\u3002",
  noSummary: "\u6682\u65e0\u6458\u8981",
  notParsed: "\u5c1a\u672a\u89e3\u6790",
  note: "\u5907\u6ce8",
  otherValue: "\u5176\u4ed6\u5185\u5bb9",
  parse: "\u89e3\u6790",
  parseFailed: "\u89e3\u6790\u5931\u8d25",
  parseStatus: "\u89e3\u6790\u72b6\u6001",
  parseSuccess: "\u89e3\u6790\u6210\u529f",
  parsedAt: "\u5df2\u89e3\u6790\u4e8e",
  parsedFiles: "\u5df2\u89e3\u6790",
  parsing: "\u89e3\u6790\u4e2d",
  projectName: "\u9879\u76ee\u540d\u79f0",
  projectStage: "\u9879\u76ee\u9636\u6bb5",
  reparse: "\u91cd\u65b0\u89e3\u6790",
  resetFilters: "\u91cd\u7f6e\u7b5b\u9009",
  save: "\u4fdd\u5b58",
  saveFailed: "\u4fdd\u5b58\u5931\u8d25",
  saving: "\u4fdd\u5b58\u4e2d",
  status: "\u72b6\u6001",
  storedFileName: "\u5b58\u50a8\u6587\u4ef6\u540d",
  tags: "\u6807\u7b7e",
  tagsHelp: "\u591a\u4e2a\u6807\u7b7e\u7528\u9017\u53f7\u5206\u9694",
  textSummary: "\u6587\u672c\u6458\u8981",
  unsupported: "V3.1 \u6682\u4e0d\u652f\u6301\u89e3\u6790",
  version: "\u7248\u672c",
  visibility: "\u53ef\u89c1\u8303\u56f4",
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

function createOption(value: string, customValue?: string): MetadataOptionField {
  return customValue ? { value, customValue } : { value };
}

function createDefaultMetadata(file: UploadedFile): FileMetadata {
  const now = new Date().toISOString();

  return {
    metadataVersion,
    fileName: file.name,
    originalName: file.originalName,
    category: createOption("\u5176\u4ed6"),
    businessDirection: createOption("\u5176\u4ed6"),
    projectStage: createOption("\u552e\u524d"),
    visibility: "\u5185\u90e8\u53ef\u89c1",
    industry: createOption("\u5176\u4ed6"),
    importance: "\u4e2d",
    version: "v1.0",
    status: "\u53ef\u7528",
    customerName: "",
    projectName: "",
    tags: [],
    note: "",
    createdAt: now,
    updatedAt: now,
  };
}

function createMetadataMap(metadata: FileMetadata[]) {
  return Object.fromEntries(
    metadata.map((metadataItem) => [metadataItem.fileName, metadataItem]),
  );
}

function metadataForFile(
  file: UploadedFile,
  metadataByFileName: Record<string, FileMetadata>,
) {
  return metadataByFileName[file.name] ?? createDefaultMetadata(file);
}

export function AdminFileList({
  files,
  metadata,
  parsedFiles,
}: AdminFileListProps) {
  const { dictionary } = useLanguage();
  const [visibleFiles, setVisibleFiles] = useState(files);
  const [metadataByFileName, setMetadataByFileName] = useState<
    Record<string, FileMetadata>
  >(() => createMetadataMap(metadata));
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [metadataDraft, setMetadataDraft] = useState<FileMetadata | null>(null);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>(
    {},
  );
  const [filters, setFilters] = useState<MetadataFilters>({
    category: "",
    businessDirection: "",
    projectStage: "",
    visibility: "",
  });
  const [parsedByFileName, setParsedByFileName] = useState(() =>
    Object.fromEntries(parsedFiles.map((file) => [file.fileName, file])),
  );
  const [parseStatuses, setParseStatuses] = useState<Record<string, ParseStatus>>(
    {},
  );
  const [deleteStatuses, setDeleteStatuses] = useState<
    Record<string, DeleteStatus>
  >({});
  const filteredFiles = useMemo(
    () =>
      visibleFiles.filter((file) => {
        const item = metadataForFile(file, metadataByFileName);

        return (
          (!filters.category || item.category.value === filters.category) &&
          (!filters.businessDirection ||
            item.businessDirection.value === filters.businessDirection) &&
          (!filters.projectStage ||
            item.projectStage.value === filters.projectStage) &&
          (!filters.visibility || item.visibility === filters.visibility)
        );
      }),
    [filters, metadataByFileName, visibleFiles],
  );
  const fileLabel =
    filteredFiles.length === 1
      ? dictionary.admin.fileSingular
      : dictionary.admin.filePlural;
  const parsedCount = useMemo(
    () => visibleFiles.filter((file) => parsedByFileName[file.name]).length,
    [visibleFiles, parsedByFileName],
  );

  function beginEditMetadata(file: UploadedFile) {
    setEditingFileName(file.name);
    setMetadataDraft(metadataForFile(file, metadataByFileName));
  }

  function updateDraft<K extends keyof FileMetadata>(
    key: K,
    value: FileMetadata[K],
  ) {
    setMetadataDraft((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  function updateDraftOption(
    key: "category" | "businessDirection" | "projectStage" | "industry",
    value: string,
  ) {
    setMetadataDraft((current) =>
      current ? { ...current, [key]: createOption(value) } : current,
    );
  }

  function updateDraftCustomOption(
    key: "category" | "businessDirection" | "projectStage" | "industry",
    customValue: string,
  ) {
    setMetadataDraft((current) =>
      current
        ? {
            ...current,
            [key]: {
              ...(current[key] as MetadataOptionField),
              customValue,
            },
          }
        : current,
    );
  }

  async function saveMetadata() {
    if (!metadataDraft) {
      return;
    }

    setSaveStatuses((current) => ({
      ...current,
      [metadataDraft.fileName]: {
        tone: "loading",
        message: adminText.saving,
      },
    }));

    try {
      const response = await fetch("/api/file-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadataDraft),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? adminText.saveFailed);
      }

      setMetadataByFileName((current) => ({
        ...current,
        [result.metadata.fileName]: result.metadata,
      }));
      setSaveStatuses((current) => ({
        ...current,
        [result.metadata.fileName]: {
          tone: "success",
          message: adminText.metadataSaved,
        },
      }));
      setEditingFileName(null);
      setMetadataDraft(null);
    } catch (error) {
      setSaveStatuses((current) => ({
        ...current,
        [metadataDraft.fileName]: {
          tone: "error",
          message: `${adminText.saveFailed}\uff1a${
            error instanceof Error ? error.message : adminText.failedUnknown
          }`,
        },
      }));
    }
  }

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
      const message =
        error instanceof Error ? error.message : adminText.failedUnknown;

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
      setMetadataByFileName((current) => {
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
            error instanceof Error ? error.message : adminText.failedUnknown
          }`,
        },
      }));
    }
  }

  function renderFilter(
    label: string,
    value: string,
    options: readonly string[],
    onChange: (value: string) => void,
  ) {
    return (
      <label className="text-sm font-medium text-slate-700">
        <span className="mb-2 block">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{adminText.all}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  function renderOptionEditor(
    label: string,
    key: "category" | "businessDirection" | "projectStage" | "industry",
    options: readonly string[],
  ) {
    if (!metadataDraft) {
      return null;
    }

    const field = metadataDraft[key] as MetadataOptionField;

    return (
      <div>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-2 block">{label}</span>
          <select
            value={field.value}
            onChange={(event) => updateDraftOption(key, event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        {field.value === "\u5176\u4ed6" ? (
          <input
            value={field.customValue ?? ""}
            onChange={(event) =>
              updateDraftCustomOption(key, event.target.value)
            }
            placeholder={adminText.otherValue}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">
          {dictionary.admin.uploadedFiles}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {filteredFiles.length} {fileLabel} {dictionary.admin.available}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {adminText.localParsed}
          {"："}
          {adminText.parsedFiles} {parsedCount} {adminText.fileUnit}
          {"。"}
        </p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-950">
            {adminText.filters}
          </h3>
          <button
            type="button"
            onClick={() =>
              setFilters({
                category: "",
                businessDirection: "",
                projectStage: "",
                visibility: "",
              })
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {adminText.resetFilters}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {renderFilter(
            adminText.category,
            filters.category,
            metadataOptions.category,
            (value) => setFilters((current) => ({ ...current, category: value })),
          )}
          {renderFilter(
            adminText.businessDirection,
            filters.businessDirection,
            metadataOptions.businessDirection,
            (value) =>
              setFilters((current) => ({
                ...current,
                businessDirection: value,
              })),
          )}
          {renderFilter(
            adminText.projectStage,
            filters.projectStage,
            metadataOptions.projectStage,
            (value) =>
              setFilters((current) => ({ ...current, projectStage: value })),
          )}
          {renderFilter(
            adminText.visibility,
            filters.visibility,
            metadataOptions.visibility,
            (value) =>
              setFilters((current) => ({ ...current, visibility: value })),
          )}
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          {dictionary.admin.empty}
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-[18%] px-4 py-3 font-semibold">
                  {dictionary.admin.fileName}
                </th>
                <th className="w-[7%] px-4 py-3 font-semibold">
                  {dictionary.admin.size}
                </th>
                <th className="w-[12%] px-4 py-3 font-semibold">
                  {dictionary.admin.uploaded}
                </th>
                <th className="w-[22%] px-4 py-3 font-semibold">
                  {adminText.metadata}
                </th>
                <th className="w-[12%] px-4 py-3 font-semibold">
                  {adminText.parseStatus}
                </th>
                <th className="w-[19%] px-4 py-3 font-semibold">
                  {adminText.textSummary}
                </th>
                <th className="w-[12%] px-4 py-3 font-semibold">
                  {adminText.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFiles.map((file) => {
                const fileMetadata = metadataForFile(file, metadataByFileName);
                const parsedFile = parsedByFileName[file.name];
                const status = parseStatuses[file.name];
                const deleteStatus = deleteStatuses[file.name];
                const saveStatus = saveStatuses[file.name];
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
                  <tr key={file.name} className="align-top">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <span className="line-clamp-2 break-all">
                        {file.originalName}
                      </span>
                      {saveStatus ? (
                        <span
                          className={`mt-1 block text-xs font-normal ${
                            saveStatus.tone === "error"
                              ? "text-red-700"
                              : saveStatus.tone === "success"
                                ? "text-emerald-700"
                                : "text-slate-500"
                          }`}
                        >
                          {saveStatus.message}
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
                    <td className="px-4 py-4 text-slate-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatUploadTime(
                        file.uploadedAt,
                        dictionary.admin.dateLocale,
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div className="space-y-1">
                        <div>
                          {adminText.category}
                          {"："}
                          {getEffectiveMetadataValue(fileMetadata.category)}
                        </div>
                        <div>
                          {adminText.businessDirection}
                          {"："}
                          {getEffectiveMetadataValue(
                            fileMetadata.businessDirection,
                          )}
                        </div>
                        <div>
                          {adminText.projectStage}
                          {"："}
                          {getEffectiveMetadataValue(fileMetadata.projectStage)}
                        </div>
                        <div>
                          {adminText.visibility}
                          {"："}
                          {fileMetadata.visibility}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
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
                    <td className="px-4 py-4 text-slate-600">
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
                    <td className="space-y-2 px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={!isSupported || isParsing || isDeleting}
                          onClick={() => parseFile(file.name)}
                          className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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
                          onClick={() => beginEditMetadata(file)}
                          className="rounded-md border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                        >
                          {adminText.editMetadata}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => deleteFile(file.name)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {isDeleting ? adminText.deleting : adminText.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {metadataDraft && editingFileName ? (
        <div className="fixed inset-0 z-50 bg-slate-950/30 p-4">
          <div className="mx-auto h-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-950">
            {adminText.editMetadata}
            {"："}
            {metadataDraft.originalName}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {renderOptionEditor(
              adminText.category,
              "category",
              metadataOptions.category,
            )}
            {renderOptionEditor(
              adminText.businessDirection,
              "businessDirection",
              metadataOptions.businessDirection,
            )}
            {renderOptionEditor(
              adminText.projectStage,
              "projectStage",
              metadataOptions.projectStage,
            )}
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.visibility}</span>
              <select
                value={metadataDraft.visibility}
                onChange={(event) =>
                  updateDraft("visibility", event.target.value)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {metadataOptions.visibility.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {renderOptionEditor(
              adminText.industry,
              "industry",
              metadataOptions.industry,
            )}
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.importance}</span>
              <select
                value={metadataDraft.importance}
                onChange={(event) =>
                  updateDraft("importance", event.target.value)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {metadataOptions.importance.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.status}</span>
              <select
                value={metadataDraft.status}
                onChange={(event) => updateDraft("status", event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {metadataOptions.status.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.version}</span>
              <input
                value={metadataDraft.version}
                onChange={(event) => updateDraft("version", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.customerName}</span>
              <input
                value={metadataDraft.customerName}
                onChange={(event) =>
                  updateDraft("customerName", event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">{adminText.projectName}</span>
              <input
                value={metadataDraft.projectName}
                onChange={(event) =>
                  updateDraft("projectName", event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-3">
              <span className="mb-2 block">{adminText.tags}</span>
              <input
                value={metadataDraft.tags.join(", ")}
                onChange={(event) =>
                  updateDraft(
                    "tags",
                    event.target.value
                      .split(/[,，]/)
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                placeholder={adminText.tagsHelp}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-3">
              <span className="mb-2 block">{adminText.note}</span>
              <textarea
                value={metadataDraft.note}
                onChange={(event) => updateDraft("note", event.target.value)}
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={saveMetadata}
              className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {adminText.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingFileName(null);
                setMetadataDraft(null);
              }}
              className="rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
            >
              {adminText.cancel}
            </button>
          </div>
        </div>
        </div>
      ) : null}
    </section>
  );
}
