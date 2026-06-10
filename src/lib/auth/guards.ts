import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { getSessionPayloadFromCookie } from "./session";

export const adminRoleSlugs = ["super_admin", "internal_admin"] as const;

type AdminRoleSlug = (typeof adminRoleSlugs)[number];

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const payload = await getSessionPayloadFromCookie();

  if (!payload) {
    return null;
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || user.status !== "active" || user.disabledAt) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.userRoles.map((userRole) => userRole.role.slug),
  };
}

export function hasAnyRole(user: CurrentUser, allowedRoles: readonly string[]) {
  return user.roles.some((role) => allowedRoles.includes(role));
}

export async function requireAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasAnyRole(user, adminRoleSlugs)) {
    redirect("/login?error=forbidden");
  }

  return user;
}

export async function requireAdminApi() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!hasAnyRole(user, adminRoleSlugs)) {
    return {
      user,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { user, response: null };
}

export function isAdminRole(role: string): role is AdminRoleSlug {
  return adminRoleSlugs.includes(role as AdminRoleSlug);
}
