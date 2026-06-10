import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import {
  getAdminUser,
  updateAdminUser,
  UserManagementError,
} from "@/lib/admin-users";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    return NextResponse.json({ user: await getAdminUser(id) });
  } catch (error) {
    const status = error instanceof UserManagementError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "获取用户详情失败。";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = await updateAdminUser(auth.user, id, body);

    return NextResponse.json({ user });
  } catch (error) {
    const status = error instanceof UserManagementError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "更新用户失败。";

    return NextResponse.json({ error: message }, { status });
  }
}
