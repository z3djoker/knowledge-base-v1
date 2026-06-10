import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import {
  createAdminUser,
  listAdminUsers,
  UserManagementError,
} from "@/lib/admin-users";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    return NextResponse.json(await listAdminUsers());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "获取用户列表失败。";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const user = await createAdminUser(auth.user, body);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const status = error instanceof UserManagementError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "创建用户失败。";

    return NextResponse.json({ error: message }, { status });
  }
}
