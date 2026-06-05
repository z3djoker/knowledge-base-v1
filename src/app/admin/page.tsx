import { AdminFileList } from "@/components/admin-file-list";
import { SiteShell } from "@/components/site-shell";
import { AdminIntro } from "./ui";
import { listAdminFiles } from "@/lib/admin-files";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { files, parsedFiles, metadata } = await listAdminFiles();

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
