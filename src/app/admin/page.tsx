import { AdminFileList } from "@/components/admin-file-list";
import { SiteShell } from "@/components/site-shell";
import { AdminIntro } from "./ui";
import { listFileMetadata } from "@/lib/file-metadata";
import { listUploadedFiles } from "@/lib/files";
import { listParsedFiles } from "@/lib/parsed-files";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const files = await listUploadedFiles();
  const parsedFiles = await listParsedFiles();
  const metadata = await listFileMetadata();

  return (
    <SiteShell>
      <AdminIntro />
      <AdminFileList
        files={files}
        metadata={metadata}
        parsedFiles={parsedFiles}
      />
    </SiteShell>
  );
}
