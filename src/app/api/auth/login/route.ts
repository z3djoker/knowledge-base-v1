import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码。" },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (
      !user ||
      !user.passwordHash ||
      user.status !== "active" ||
      user.disabledAt ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "邮箱或密码错误。" },
        { status: 401 },
      );
    }

    const roles = user.userRoles.map((userRole) => userRole.role.slug);
    const token = createSessionToken({
      sub: user.id,
      email: user.email,
      roles,
    });

    await setSessionCookie(token);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败。";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
