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

export function UploadForm() {
  const { dictionary } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      message === "File size must be 20MB or less."
    ) {
      return dictionary.upload.sizeError;
    }

    if (message === "Unsupported file type.") {
      return dictionary.upload.unsupportedType;
    }

    return message ?? dictionary.upload.uploadFailed;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus({ tone: "error", message: dictionary.upload.missingFile });
      return;
    }

    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatus({
        tone: "error",
        message: dictionary.upload.sizeError,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    setIsUploading(true);
    setStatus({ tone: "idle", message: dictionary.upload.uploading });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(translateUploadError(result.error));
      }

      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setStatus({
        tone: "success",
        message: `${dictionary.upload.uploadedPrefix} ${result.file.name}.`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : dictionary.upload.uploadFailed,
      });
    } finally {
      setIsUploading(false);
    }
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
          {dictionary.upload.formDescription}
        </p>

        <label className="mt-6 block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white">
          <span>{dictionary.upload.chooseFile}</span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept={uploadAcceptAttribute}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setStatus({
                tone: "idle",
                message: file
                  ? `${file.name} (${formatFileSize(file.size)})`
                  : dictionary.upload.idle,
              });
            }}
          />
        </label>

        <div
          className={`mt-4 w-full rounded-md border px-4 py-3 text-sm ${statusClassName}`}
        >
          {!selectedFile && status.tone === "idle"
            ? dictionary.upload.idle
            : status.message}
        </div>

        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isUploading
            ? dictionary.upload.uploadingButton
            : dictionary.upload.uploadButton}
        </button>
      </div>
    </form>
  );
}
