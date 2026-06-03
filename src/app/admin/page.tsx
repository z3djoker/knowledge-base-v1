import { AdminFileList } from "@/components/admin-file-list";
import { SiteShell } from "@/components/site-shell";
import { AdminIntro } from "./ui";
import { listUploadedFiles } from "@/lib/files";

export default async function AdminPage() {
  const files = await listUploadedFiles();

  return (
    <SiteShell>
      <AdminIntro />
      <AdminFileList files={files} />
    </SiteShell>
  );
}
