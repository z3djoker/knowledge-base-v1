import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const roles = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "System-wide administrator role reserved for future use.",
  },
  {
    slug: "internal_admin",
    name: "Internal Admin",
    description: "Internal administrator role reserved for future use.",
  },
  {
    slug: "sales",
    name: "Sales",
    description: "Sales role reserved for future project/customer access.",
  },
  {
    slug: "engineer",
    name: "Engineer",
    description: "Engineer role reserved for future implementation access.",
  },
  {
    slug: "customer_admin",
    name: "Customer Admin",
    description: "Customer administrator role reserved for future use.",
  },
  {
    slug: "customer_user",
    name: "Customer User",
    description: "Customer user role reserved for future use.",
  },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    });
  }
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
