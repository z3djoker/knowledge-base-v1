import { AdminFileList } from "@/components/admin-file-list";
import { SiteShell } from "@/components/site-shell";
import { AdminIntro } from "./ui";
import { listUploadedFiles } from "@/lib/files";
import { listParsedFiles } from "@/lib/parsed-files";

export default async function AdminPage() {
  const files = await listUploadedFiles();
  const parsedFiles = await listParsedFiles();

  return (
    <SiteShell>
      <AdminIntro />
      <AdminFileList files={files} parsedFiles={parsedFiles} />
    </SiteShell>
  );
}
