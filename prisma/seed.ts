import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.HR_EMAIL;
  const password = process.env.HR_PASSWORD;
  const name = process.env.HR_NAME || "HR Manpower";

  if (!email || !password) {
    throw new Error("HR_EMAIL and HR_PASSWORD must be set to seed HR account.");
  }

  const existing = await prisma.user.findFirst({ where: { role: UserRole.HR } });
  if (existing) {
    console.log("HR account already exists.");
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      role: UserRole.HR,
      email,
      passwordHash,
      name,
    },
  });

  console.log("HR account created:", email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
