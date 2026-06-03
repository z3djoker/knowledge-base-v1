"use client";

import { useLanguage } from "@/components/language-provider";
import { formatFileSize } from "@/lib/file-format";
import type { UploadedFile } from "@/lib/files";

type AdminFileListProps = {
  files: UploadedFile[];
};

function formatUploadTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminFileList({ files }: AdminFileListProps) {
  const { dictionary } = useLanguage();
  const fileLabel =
    files.length === 1
      ? dictionary.admin.fileSingular
      : dictionary.admin.filePlural;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">
          {dictionary.admin.uploadedFiles}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {files.length} {fileLabel} {dictionary.admin.available}
        </p>
      </div>

      {files.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          {dictionary.admin.empty}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {files.map((file) => (
                <tr key={file.name}>
                  <td className="max-w-[420px] px-6 py-4 font-medium text-slate-900">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
