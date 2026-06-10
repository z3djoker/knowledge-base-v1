import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import {
  updateAdminUserRoles,
  UserManagementError,
} from "@/lib/admin-users";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = await updateAdminUserRoles(auth.user, id, body);

    return NextResponse.json({ user });
  } catch (error) {
    const status = error instanceof UserManagementError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "更新角色失败。";

    return NextResponse.json({ error: message }, { status });
  }
}
