"use client";

import { FormEvent, useRef, useState } from "react";
import {
  MAX_UPLOAD_SIZE_BYTES,
  uploadAcceptAttribute,
} from "@/lib/upload-config";
import { formatFileSize } from "@/lib/file-format";
import { useLanguage } from "@/components/language-provider";

type UploadStatus = {
  tone: "idle" | "success" | "error";
  message: string;
};

type UploadResult = {
  fileName: string;
  tone: "success" | "error";
  message: string;
};

const uploadText = {
  uploadingBatch: "\u6b63\u5728\u6279\u91cf\u4e0a\u4f20...",
  sizeError: "\u6587\u4ef6\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 200MB\u3002",
  itemFailed: "\u4e0a\u4f20\u5931\u8d25",
  itemSuccess: "\u4e0a\u4f20\u6210\u529f",
  batchSuccess: "\u6279\u91cf\u4e0a\u4f20\u5b8c\u6210",
  selected: "\u5df2\u9009\u62e9",
  files: "\u4e2a\u6587\u4ef6",
  batchUpload: "\u6279\u91cf\u4e0a\u4f20",
  uploading: "\u4e0a\u4f20\u4e2d...",
  success: "\u6210\u529f",
  failed: "\u5931\u8d25",
  description:
    "PDF\u3001DOCX\u3001XLSX\u3001PPTX \u548c\u56fe\u7247\u6587\u4ef6\u652f\u6301\u6279\u91cf\u4e0a\u4f20\uff0c\u5355\u4e2a\u6587\u4ef6\u4e0d\u8d85\u8fc7 200MB\u3002",
};

export function UploadForm() {
  const { dictionary } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({
    tone: "idle",
    message: dictionary.upload.idle,
  });

  function translateUploadError(message: string | undefined) {
    if (message === "No file provided.") {
      return dictionary.upload.missingFile;
    }

    if (
      message === "File size exceeds the 20MB limit." ||
      message === "File size must be 20MB or less." ||
      message === uploadText.sizeError
    ) {
      return uploadText.sizeError;
    }

    if (message === "Unsupported file type.") {
      return dictionary.upload.unsupportedType;
    }

    return message ?? dictionary.upload.uploadFailed;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setStatus({ tone: "error", message: dictionary.upload.missingFile });
      return;
    }

    setIsUploading(true);
    setUploadResults([]);
    setStatus({ tone: "idle", message: uploadText.uploadingBatch });

    const results: UploadResult[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        results.push({
          fileName: file.name,
          tone: "error",
          message: `${uploadText.itemFailed}\uff1a${uploadText.sizeError}`,
        });
        setUploadResults([...results]);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(translateUploadError(result.error));
        }

        results.push({
          fileName: file.name,
          tone: "success",
          message: `${uploadText.itemSuccess}\uff1a${
            result.file.originalName ?? file.name
          }`,
        });
      } catch (error) {
        results.push({
          fileName: file.name,
          tone: "error",
          message: `${uploadText.itemFailed}\uff1a${
            error instanceof Error ? error.message : dictionary.upload.uploadFailed
          }`,
        });
      }

      setUploadResults([...results]);
    }

    const successCount = results.filter((result) => result.tone === "success")
      .length;
    const errorCount = results.length - successCount;

    if (successCount === results.length) {
      setStatus({
        tone: "success",
        message: `${uploadText.batchSuccess}\uff1a${successCount} ${uploadText.files}${uploadText.itemSuccess}\u3002`,
      });
      setSelectedFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } else if (successCount > 0) {
      setStatus({
        tone: "success",
        message: `${uploadText.batchSuccess}\uff1a${successCount} ${uploadText.success}\uff0c${errorCount} ${uploadText.failed}\u3002`,
      });
    } else {
      setStatus({
        tone: "error",
        message: `${uploadText.itemFailed}\uff1a${errorCount} ${uploadText.files}\u672a\u4e0a\u4f20\u6210\u529f\u3002`,
      });
    }

    setIsUploading(false);
  }

  const statusClassName =
    status.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status.tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-dashed border-slate-300 bg-white p-8 shadow-sm"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-lg bg-cyan-50 text-xl font-semibold text-cyan-700">
          +
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          {dictionary.upload.formTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {uploadText.description}
        </p>

        <label className="mt-6 block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white">
          <span>{dictionary.upload.chooseFile}</span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            multiple
            accept={uploadAcceptAttribute}
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              setSelectedFiles(files);
              setUploadResults([]);
              setStatus({
                tone: "idle",
                message: files.length
                  ? `${uploadText.selected} ${files.length} ${uploadText.files}\uff1a${files
                      .map((file) => `${file.name} (${formatFileSize(file.size)})`)
                      .join("\uff1b")}`
                  : dictionary.upload.idle,
              });
            }}
          />
        </label>

        <div
          className={`mt-4 w-full rounded-md border px-4 py-3 text-sm ${statusClassName}`}
        >
          {selectedFiles.length === 0 && status.tone === "idle"
            ? dictionary.upload.idle
            : status.message}
        </div>

        {uploadResults.length > 0 ? (
          <div className="mt-4 w-full space-y-2 text-left text-sm">
            {uploadResults.map((result) => (
              <div
                key={`${result.fileName}-${result.message}`}
                className={`rounded-md border px-4 py-3 ${
                  result.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="font-medium">{result.fileName}</span>
                <span className="ml-2">{result.message}</span>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={selectedFiles.length === 0 || isUploading}
          className="mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isUploading
            ? uploadText.uploading
            : selectedFiles.length > 1
              ? uploadText.batchUpload
              : dictionary.upload.uploadButton}
        </button>
      </div>
    </form>
  );
}
