import { AdminFileList } from "@/components/admin-file-list";
import { AdminUserManagement } from "@/components/admin-user-management";
import { SiteShell } from "@/components/site-shell";
import { AdminIntro } from "./ui";
import { listAdminFiles } from "@/lib/admin-files";
import { requireAdminPage } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await requireAdminPage();
  const [{ files, parsedFiles, metadata }, { users, roles }] =
    await Promise.all([listAdminFiles(), listAdminUsers()]);

  return (
    <SiteShell>
      <AdminIntro />
      <AdminUserManagement
        currentUser={currentUser}
        initialUsers={users}
        roles={roles}
      />
      <AdminFileList
        files={files}
        metadata={metadata}
        parsedFiles={parsedFiles}
      />
    </SiteShell>
  );
}
