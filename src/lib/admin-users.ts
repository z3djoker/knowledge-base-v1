import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { CurrentUser } from "@/lib/auth/guards";

type PrismaUserReader = Pick<ReturnType<typeof getPrisma>, "user">;

export const manageableRoleSlugs = [
  "super_admin",
  "internal_admin",
  "sales",
  "engineer",
  "customer_admin",
  "customer_user",
] as const;

export type ManageableRoleSlug = (typeof manageableRoleSlugs)[number];

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  disabledAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
};

export type AdminRoleRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export class UserManagementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserManagementError";
    this.status = status;
  }
}

type UserWithRoles = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  disabledAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userRoles: {
    role: {
      slug: string;
    };
  }[];
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeName(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "active";
  }

  if (value === "active" || value === "disabled") {
    return value;
  }

  throw new UserManagementError("用户状态不合法。");
}

function normalizeRoleSlugs(value: unknown) {
  if (!Array.isArray(value)) {
    throw new UserManagementError("请至少选择一个角色。");
  }

  const roleSlugs = Array.from(
    new Set(
      value
        .filter((role): role is string => typeof role === "string")
        .map((role) => role.trim())
        .filter(Boolean),
    ),
  );

  if (roleSlugs.length === 0) {
    throw new UserManagementError("请至少选择一个角色。");
  }

  const invalidRole = roleSlugs.find(
    (role) => !manageableRoleSlugs.includes(role as ManageableRoleSlug),
  );

  if (invalidRole) {
    throw new UserManagementError(`角色不合法：${invalidRole}`);
  }

  return roleSlugs;
}

function mapUser(user: UserWithRoles): AdminUserRecord {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    disabledAt: user.disabledAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.userRoles.map((userRole) => userRole.role.slug),
  };
}

function isSuperAdmin(user: CurrentUser) {
  return user.roles.includes("super_admin");
}

function isTargetSuperAdmin(user: UserWithRoles) {
  return user.userRoles.some((userRole) => userRole.role.slug === "super_admin");
}

async function countActiveSuperAdmins(tx: PrismaUserReader = getPrisma()) {
  return tx.user.count({
    where: {
      status: "active",
      disabledAt: null,
      userRoles: {
        some: {
          role: {
            slug: "super_admin",
          },
        },
      },
    },
  });
}

async function getUserOrThrow(id: string, tx: PrismaUserReader = getPrisma()) {
  const user = await tx.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new UserManagementError("用户不存在。", 404);
  }

  return user;
}

async function assertCanManageTarget(actor: CurrentUser, target: UserWithRoles) {
  if (!isSuperAdmin(actor) && isTargetSuperAdmin(target)) {
    throw new UserManagementError("internal_admin 不能管理 super_admin。", 403);
  }
}

async function assertCanUseRoles(actor: CurrentUser, roleSlugs: string[]) {
  if (!isSuperAdmin(actor) && roleSlugs.includes("super_admin")) {
    throw new UserManagementError("internal_admin 不能授予 super_admin。", 403);
  }
}

async function assertCanDisableTarget(
  actor: CurrentUser,
  target: UserWithRoles,
  nextStatus: string,
) {
  if (nextStatus !== "disabled") {
    return;
  }

  if (target.id === actor.id) {
    throw new UserManagementError("不能禁用当前登录的管理员账号。");
  }

  if (
    target.status === "active" &&
    !target.disabledAt &&
    isTargetSuperAdmin(target) &&
    (await countActiveSuperAdmins()) <= 1
  ) {
    throw new UserManagementError("不能禁用最后一个 super_admin。");
  }
}

async function assertCanChangeRoles(
  target: UserWithRoles,
  nextRoleSlugs: string[],
) {
  const currentlySuperAdmin = isTargetSuperAdmin(target);
  const nextSuperAdmin = nextRoleSlugs.includes("super_admin");

  if (
    currentlySuperAdmin &&
    !nextSuperAdmin &&
    target.status === "active" &&
    !target.disabledAt &&
    (await countActiveSuperAdmins()) <= 1
  ) {
    throw new UserManagementError("不能降级最后一个 super_admin。");
  }
}

export async function listAdminUsers() {
  const prisma = getPrisma();
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: {
          include: {
            role: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.role.findMany({
      where: {
        slug: {
          in: [...manageableRoleSlugs],
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    users: users.map(mapUser),
    roles: roles.map((role) => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
    })),
  };
}

export async function getAdminUser(id: string) {
  return mapUser(await getUserOrThrow(id));
}

export async function createAdminUser(
  actor: CurrentUser,
  input: {
    email?: unknown;
    name?: unknown;
    password?: unknown;
    status?: unknown;
    roleSlugs?: unknown;
  },
) {
  const email =
    typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input.password === "string" ? input.password : "";
  const roleSlugs = normalizeRoleSlugs(input.roleSlugs);
  const status = normalizeStatus(input.status);

  if (!email) {
    throw new UserManagementError("请输入邮箱。");
  }

  if (password.length < 8) {
    throw new UserManagementError("密码至少需要 8 位。");
  }

  await assertCanUseRoles(actor, roleSlugs);

  const prisma = getPrisma();
  const passwordHash = await hashPassword(password);

  const createdUser = await prisma.$transaction(async (tx) => {
    const roles = await tx.role.findMany({
      where: {
        slug: {
          in: roleSlugs,
        },
      },
    });

    if (roles.length !== roleSlugs.length) {
      throw new UserManagementError("存在尚未初始化的角色。");
    }

    const user = await tx.user.create({
      data: {
        email,
        name: normalizeName(input.name),
        passwordHash,
        status,
        disabledAt: status === "disabled" ? new Date() : null,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
      },
    });

    await tx.userRole.createMany({
      data: roles.map((role) => ({
        userId: user.id,
        roleId: role.id,
        scopeType: "global",
      })),
    });

    return getUserOrThrow(user.id, tx);
  });

  return mapUser(createdUser);
}

export async function updateAdminUser(
  actor: CurrentUser,
  id: string,
  input: {
    email?: unknown;
    name?: unknown;
    status?: unknown;
  },
) {
  const prisma = getPrisma();
  const currentUser = await getUserOrThrow(id);
  await assertCanManageTarget(actor, currentUser);

  const nextStatus =
    input.status === undefined ? currentUser.status : normalizeStatus(input.status);

  await assertCanDisableTarget(actor, currentUser, nextStatus);

  const email =
    typeof input.email === "string" ? normalizeEmail(input.email) : undefined;

  if (email === "") {
    throw new UserManagementError("请输入邮箱。");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(email ? { email } : {}),
      ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
      status: nextStatus,
      disabledAt:
        nextStatus === "disabled"
          ? currentUser.disabledAt ?? new Date()
          : null,
      updatedByUserId: actor.id,
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapUser(updatedUser);
}

export async function updateAdminUserPassword(
  actor: CurrentUser,
  id: string,
  input: {
    password?: unknown;
  },
) {
  const password = typeof input.password === "string" ? input.password : "";

  if (password.length < 8) {
    throw new UserManagementError("密码至少需要 8 位。");
  }

  const currentUser = await getUserOrThrow(id);
  await assertCanManageTarget(actor, currentUser);

  const prisma = getPrisma();
  const passwordHash = await hashPassword(password);
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      updatedByUserId: actor.id,
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapUser(updatedUser);
}

export async function updateAdminUserRoles(
  actor: CurrentUser,
  id: string,
  input: {
    roleSlugs?: unknown;
  },
) {
  const roleSlugs = normalizeRoleSlugs(input.roleSlugs);
  const prisma = getPrisma();
  const currentUser = await getUserOrThrow(id);

  await assertCanManageTarget(actor, currentUser);
  await assertCanUseRoles(actor, roleSlugs);
  await assertCanChangeRoles(currentUser, roleSlugs);

  const updatedUser = await prisma.$transaction(async (tx) => {
    const roles = await tx.role.findMany({
      where: {
        slug: {
          in: roleSlugs,
        },
      },
    });

    if (roles.length !== roleSlugs.length) {
      throw new UserManagementError("存在尚未初始化的角色。");
    }

    await tx.userRole.deleteMany({
      where: { userId: id },
    });

    await tx.userRole.createMany({
      data: roles.map((role) => ({
        userId: id,
        roleId: role.id,
        scopeType: "global",
      })),
    });

    await tx.user.update({
      where: { id },
      data: { updatedByUserId: actor.id },
    });

    return getUserOrThrow(id, tx);
  });

  return mapUser(updatedUser);
}
