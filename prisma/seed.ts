import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/password";
import { normalizeUsername } from "../src/lib/username";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to run the seed.");
}

const parsed = new URL(databaseUrl);
const pool = new Pool({
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 5432,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

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
  const rawUsername =
    process.env.HR_USERNAME || email.split("@")[0] || name || "hr";
  const username = normalizeUsername(rawUsername) || "hr";
  await prisma.user.create({
    data: {
      role: UserRole.HR,
      email,
      username,
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
    await pool.end();
  });
