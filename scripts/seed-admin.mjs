import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional when variables are supplied by the shell.
}

const scryptAsync = promisify(scrypt);
const databaseUrl = process.env.DATABASE_URL;
const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.INITIAL_ADMIN_NAME ?? "Super Admin";

if (!databaseUrl || !email || !password) {
  console.error(
    "DATABASE_URL, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD are required.",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function hashPassword(value) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(value, salt, 64);

  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

async function main() {
  const role = await prisma.role.upsert({
    where: { slug: "super_admin" },
    update: {
      name: "Super Admin",
      description: "System-wide administrator role reserved for future use.",
    },
    create: {
      slug: "super_admin",
      name: "Super Admin",
      description: "System-wide administrator role reserved for future use.",
    },
  });
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      status: "active",
      disabledAt: null,
      ...(process.env.RESET_INITIAL_ADMIN_PASSWORD === "true"
        ? { passwordHash: await hashPassword(password) }
        : {}),
    },
    create: {
      email,
      name,
      status: "active",
      passwordHash: await hashPassword(password),
    },
  });
  const existingRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      scopeType: "global",
      scopeId: null,
    },
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        scopeType: "global",
        scopeId: null,
      },
    });
  }

  console.log(`Initialized super_admin: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
